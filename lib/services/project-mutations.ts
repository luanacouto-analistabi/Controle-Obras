import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  BillingEvent,
  PaymentEvent,
  Project,
} from "@/types/database.types";
import type {
  BillingEventInput,
  PaymentEventInput,
  ProjectFormInput,
} from "@/lib/validators/project";

type FieldChange = {
  field_name: string;
  old_value: string | null;
  new_value: string | null;
};

const GENERAL_FIELD_LABELS: Record<keyof ProjectFormInput["general"], string> = {
  cc: "CC",
  project_coordinator: "Coordenador de Projeto",
  start_date: "Data de Início",
  end_date: "Data de Fim",
  vessel_name: "Nome da Embarcação",
  client: "Cliente",
};

function diffGeneralFields(
  oldProject: Project,
  general: ProjectFormInput["general"]
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const key of Object.keys(GENERAL_FIELD_LABELS) as Array<
    keyof typeof GENERAL_FIELD_LABELS
  >) {
    const oldValue = String(oldProject[key] ?? "");
    const newValue = String(general[key] ?? "");
    if (oldValue !== newValue) {
      changes.push({
        field_name: GENERAL_FIELD_LABELS[key],
        old_value: oldValue,
        new_value: newValue,
      });
    }
  }
  return changes;
}

const PAYMENT_FIELDS: Array<keyof PaymentEventInput> = [
  "payment_event",
  "invoice_description",
  "invoice_date",
  "payment_condition",
  "expected_payment_date",
  "amount",
  "measurement_date",
  "po_issued",
  "invoice_number",
];

function diffPaymentEvents(
  oldRows: PaymentEvent[],
  newRows: PaymentEventInput[]
): FieldChange[] {
  const changes: FieldChange[] = [];
  const oldById = new Map(oldRows.map((row) => [row.id, row]));
  const seenIds = new Set<string>();

  for (const row of newRows) {
    if (row.id && oldById.has(row.id)) {
      seenIds.add(row.id);
      const old = oldById.get(row.id)!;
      for (const field of PAYMENT_FIELDS) {
        const oldValue = String(old[field] ?? "");
        const newValue = String(row[field] ?? "");
        if (oldValue !== newValue) {
          changes.push({
            field_name: `Pagamento "${row.payment_event}" — ${field}`,
            old_value: oldValue,
            new_value: newValue,
          });
        }
      }
    } else {
      changes.push({
        field_name: `Pagamento "${row.payment_event}"`,
        old_value: null,
        new_value: "adicionado",
      });
    }
  }

  for (const old of oldRows) {
    if (!seenIds.has(old.id)) {
      changes.push({
        field_name: `Pagamento "${old.payment_event}"`,
        old_value: "existia",
        new_value: "removido",
      });
    }
  }

  return changes;
}

const BILLING_FIELDS: Array<keyof BillingEventInput> = [
  "billing_date",
  "billed_amount",
  "overdue_amount",
  "new_billing_date",
];

function diffBillingEvents(
  oldRows: BillingEvent[],
  newRows: BillingEventInput[]
): FieldChange[] {
  const changes: FieldChange[] = [];
  const oldById = new Map(oldRows.map((row) => [row.id, row]));
  const seenIds = new Set<string>();

  for (const row of newRows) {
    if (row.id && oldById.has(row.id)) {
      seenIds.add(row.id);
      const old = oldById.get(row.id)!;
      for (const field of BILLING_FIELDS) {
        const oldValue = String(old[field] ?? "");
        const newValue = String(row[field] ?? "");
        if (oldValue !== newValue) {
          changes.push({
            field_name: `Faturamento de ${row.billing_date} — ${field}`,
            old_value: oldValue,
            new_value: newValue,
          });
        }
      }
    } else {
      changes.push({
        field_name: `Faturamento de ${row.billing_date}`,
        old_value: null,
        new_value: "adicionado",
      });
    }
  }

  for (const old of oldRows) {
    if (!seenIds.has(old.id)) {
      changes.push({
        field_name: `Faturamento de ${old.billing_date}`,
        old_value: "existia",
        new_value: "removido",
      });
    }
  }

  return changes;
}

function toPaymentEventRow(event: PaymentEventInput, projectId: string) {
  return {
    project_id: projectId,
    payment_event: event.payment_event,
    invoice_description: event.invoice_description || null,
    invoice_date: event.invoice_date || null,
    payment_condition: event.payment_condition || null,
    expected_payment_date: event.expected_payment_date || null,
    amount: event.amount,
    measurement_date: event.measurement_date || null,
    po_issued: event.po_issued,
    invoice_number: event.invoice_number || null,
  };
}

function toBillingEventRow(event: BillingEventInput, projectId: string) {
  return {
    project_id: projectId,
    billing_date: event.billing_date,
    billed_amount: event.billed_amount,
    overdue_amount: event.overdue_amount,
    new_billing_date: event.new_billing_date || null,
  };
}

/** Cria um projeto novo + seus eventos de pagamento/faturamento. Sem PDF/motivo — só na edição. */
export async function createProject(input: ProjectFormInput, userId: string) {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({ ...input.general, created_by: userId, updated_by: userId })
    .select()
    .single();
  if (projectError) throw projectError;

  if (input.paymentEvents.length > 0) {
    const { error } = await supabase
      .from("payment_events")
      .insert(
        input.paymentEvents.map((e) => toPaymentEventRow(e, project.id))
      );
    if (error) throw error;
  }

  if (input.billingEvents.length > 0) {
    const { error } = await supabase
      .from("billing_events")
      .insert(
        input.billingEvents.map((e) => toBillingEventRow(e, project.id))
      );
    if (error) throw error;
  }

  return project;
}

/**
 * Salva uma alteração em projeto existente: exige motivo + novo PDF do
 * cronograma, calcula o diff campo a campo e grava tudo em
 * project_change_history apontando para o documento anexado.
 *
 * Sem transação de banco (supabase-js não expõe uma pela REST API) — os
 * passos rodam em sequência. Risco aceito por ora; revisitar com uma
 * função Postgres (RPC) se isso virar problema real.
 */
export async function updateProject(
  projectId: string,
  input: ProjectFormInput,
  opts: { reason: string; documentFile: File; userId: string }
) {
  const supabase = await createClient();

  const [
    { data: oldProject, error: projectError },
    { data: oldPayments, error: paymentsError },
    { data: oldBillings, error: billingsError },
    { data: latestDoc, error: docsError },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("payment_events").select("*").eq("project_id", projectId),
    supabase.from("billing_events").select("*").eq("project_id", projectId),
    supabase
      .from("project_documents")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (projectError) throw projectError;
  if (paymentsError) throw paymentsError;
  if (billingsError) throw billingsError;
  if (docsError) throw docsError;

  const changes = [
    ...diffGeneralFields(oldProject, input.general),
    ...diffPaymentEvents(oldPayments ?? [], input.paymentEvents),
    ...diffBillingEvents(oldBillings ?? [], input.billingEvents),
  ];
  if (changes.length === 0) {
    throw new Error("Nenhuma alteração para salvar.");
  }

  const nextVersion = (latestDoc?.version ?? 0) + 1;
  const storagePath = `${projectId}/v${nextVersion}/${Date.now()}-${opts.documentFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, opts.documentFile, { contentType: "application/pdf" });
  if (uploadError) {
    throw new Error(
      `Falha ao enviar o PDF (o bucket "project-documents" existe no Storage?): ${uploadError.message}`
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("project_documents")
    .insert({
      project_id: projectId,
      file_name: opts.documentFile.name,
      storage_path: storagePath,
      version: nextVersion,
      document_type: "cronograma",
      uploaded_by: opts.userId,
    })
    .select()
    .single();
  if (documentError) throw documentError;

  const { error: updateError } = await supabase
    .from("projects")
    .update({ ...input.general, updated_by: opts.userId })
    .eq("id", projectId);
  if (updateError) throw updateError;

  const keptPaymentIds = input.paymentEvents
    .map((e) => e.id)
    .filter((id): id is string => Boolean(id));
  const paymentIdsToDelete = (oldPayments ?? [])
    .map((p) => p.id)
    .filter((id) => !keptPaymentIds.includes(id));
  if (paymentIdsToDelete.length > 0) {
    const { error } = await supabase
      .from("payment_events")
      .delete()
      .in("id", paymentIdsToDelete);
    if (error) throw error;
  }
  for (const event of input.paymentEvents) {
    const row = toPaymentEventRow(event, projectId);
    const { error } = event.id
      ? await supabase.from("payment_events").update(row).eq("id", event.id)
      : await supabase.from("payment_events").insert(row);
    if (error) throw error;
  }

  const keptBillingIds = input.billingEvents
    .map((e) => e.id)
    .filter((id): id is string => Boolean(id));
  const billingIdsToDelete = (oldBillings ?? [])
    .map((b) => b.id)
    .filter((id) => !keptBillingIds.includes(id));
  if (billingIdsToDelete.length > 0) {
    const { error } = await supabase
      .from("billing_events")
      .delete()
      .in("id", billingIdsToDelete);
    if (error) throw error;
  }
  for (const event of input.billingEvents) {
    const row = toBillingEventRow(event, projectId);
    const { error } = event.id
      ? await supabase.from("billing_events").update(row).eq("id", event.id)
      : await supabase.from("billing_events").insert(row);
    if (error) throw error;
  }

  const { error: historyError } = await supabase
    .from("project_change_history")
    .insert(
      changes.map((change) => ({
        project_id: projectId,
        user_id: opts.userId,
        field_name: change.field_name,
        old_value: change.old_value,
        new_value: change.new_value,
        change_reason: opts.reason,
        document_id: document.id,
      }))
    );
  if (historyError) throw historyError;

  return { changesCount: changes.length };
}
