import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectFinancialSummary } from "@/types/database.types";

export type ProjectSummaryRow = Project & {
  summary: ProjectFinancialSummary | null;
};

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
