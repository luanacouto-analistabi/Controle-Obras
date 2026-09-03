import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  BillingEvent,
  PaymentEvent,
  Project,
  ProjectFinancialSummary,
} from "@/types/database.types";

export type ProjectSummaryRow = Project & {
  summary: ProjectFinancialSummary | null;
};

/** Lista de clientes distintos entre todos os projetos, para filtros. */
export async function listDistinctClients(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("client");
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.client))].sort((a, b) =>
    a.localeCompare(b)
  );
}

/** Projetos + indicadores financeiros agregados, para o dashboard consolidado. */
export async function listProjectsWithFinancialSummary(): Promise<
  ProjectSummaryRow[]
> {
  const supabase = await createClient();

  const [
    { data: projects, error: projectsError },
    { data: summaries, error: summariesError },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("cc"),
    supabase.from("project_financial_summary").select("*"),
  ]);

  if (projectsError) throw projectsError;
  if (summariesError) throw summariesError;

  const summaryByProject = new Map(
    (summaries ?? []).map((summary) => [summary.project_id, summary])
  );

  return (projects ?? []).map((project) => ({
    ...project,
    summary: summaryByProject.get(project.id) ?? null,
  }));
}

export type LastChange = {
  userId: string;
  userName: string | null;
  changedAt: string;
};

export type ProjectConfigRow = Project & {
  lastChange: LastChange | null;
  totalAmount: number;
};

/** Todos os projetos + quem/quando foi a última alteração, para a tela de Configuração. */
export async function listProjectsForConfig(): Promise<ProjectConfigRow[]> {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("cc");
  if (projectsError) throw projectsError;

  const [
    { data: historyRows, error: historyError },
    { data: paymentEvents, error: paymentEventsError },
  ] = await Promise.all([
    supabase
      .from("project_change_history")
      .select("project_id, user_id, changed_at")
      .order("changed_at", { ascending: false }),
    supabase.from("payment_events").select("project_id, amount"),
  ]);
  if (historyError) throw historyError;
  if (paymentEventsError) throw paymentEventsError;

  const totalByProject = new Map<string, number>();
  for (const event of paymentEvents ?? []) {
    totalByProject.set(
      event.project_id,
      (totalByProject.get(event.project_id) ?? 0) + event.amount
    );
  }

  const latestByProject = new Map<
    string,
    { user_id: string | null; changed_at: string }
  >();
  for (const row of historyRows ?? []) {
    if (!latestByProject.has(row.project_id)) {
      latestByProject.set(row.project_id, row);
    }
  }

  const userIds = [
    ...new Set(
      [...latestByProject.values()]
        .map((v) => v.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (projects ?? []).map((project) => {
    const last = latestByProject.get(project.id);
    return {
      ...project,
      lastChange:
        last && last.user_id
          ? {
              userId: last.user_id,
              userName: nameById.get(last.user_id) ?? null,
              changedAt: last.changed_at,
            }
          : null,
      totalAmount: totalByProject.get(project.id) ?? 0,
    };
  });
}

/** Projeto + última alteração, para telas que só precisam do cabeçalho (ex.: Final Invoice). */
export async function getProjectWithLastChange(
  id: string
): Promise<{ project: Project; lastChange: LastChange | null } | null> {
  const supabase = await createClient();

  const [
    { data: project, error: projectError },
    { data: lastHistory },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("project_change_history")
      .select("user_id, changed_at")
      .eq("project_id", id)
      .order("changed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (projectError) throw projectError;
  if (!project) return null;

  let lastChange: LastChange | null = null;
  if (lastHistory?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", lastHistory.user_id)
      .maybeSingle();
    lastChange = {
      userId: lastHistory.user_id,
      userName: profile?.full_name ?? null,
      changedAt: lastHistory.changed_at,
    };
  }

  return { project, lastChange };
}

export type ProjectEditData = {
  project: Project;
  paymentEvents: PaymentEvent[];
  billingEvents: BillingEvent[];
  lastChange: LastChange | null;
};

/** Projeto + eventos + última alteração, para pré-preencher o formulário de edição. */
export async function getProjectForEdit(
  id: string
): Promise<ProjectEditData | null> {
  const supabase = await createClient();

  const [
    { data: project, error: projectError },
    { data: paymentEvents, error: paymentError },
    { data: billingEvents, error: billingError },
    { data: lastHistory },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("payment_events")
      .select("*")
      .eq("project_id", id)
      .order("created_at"),
    supabase
      .from("billing_events")
      .select("*")
      .eq("project_id", id)
      .order("created_at"),
    supabase
      .from("project_change_history")
      .select("user_id, changed_at")
      .eq("project_id", id)
      .order("changed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (projectError) throw projectError;
  if (paymentError) throw paymentError;
  if (billingError) throw billingError;
  if (!project) return null;

  let lastChange: LastChange | null = null;
  if (lastHistory?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", lastHistory.user_id)
      .maybeSingle();
    lastChange = {
      userId: lastHistory.user_id,
      userName: profile?.full_name ?? null,
      changedAt: lastHistory.changed_at,
    };
  }

  return {
    project,
    paymentEvents: paymentEvents ?? [],
    billingEvents: billingEvents ?? [],
    lastChange,
  };
}
