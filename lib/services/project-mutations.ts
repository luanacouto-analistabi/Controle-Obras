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
  "payment_condition",
  "expected_payment_date",
  "amount",
  "status",
  "measurement_status",
  "po_issued",
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

const BILLING_FIELDS: Array<keyof BillingEventInput & keyof BillingEvent> = [
  "payment_event_id",
  "billing_date",
  "billed_amount",
  "invoice_number",
  "invoice_date",
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
    payment_condition: event.payment_condition || null,
    expected_payment_date: event.expected_payment_date || null,
    amount: event.amount,
    status: event.status,
    measurement_status: event.measurement_status,
    po_issued: event.po_issued,
  };
}

function toBillingEventRow(event: BillingEventInput, projectId: string) {
  return {
    project_id: projectId,
    payment_event_id: event.payment_event_id,
    billing_date: event.billing_date,
    billed_amount: event.billed_amount,
    invoice_number: event.invoice_number || null,
    invoice_date: event.invoice_date || null,
    new_billing_date: event.new_billing_date || null,
  };
}

/** Cria um projeto novo + seus eventos de pagamento (Bloco 1 + 2). Sem PDF/motivo — só na edição. */
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

  return project;
}

/**
 * Salva uma alteração em projeto existente (Bloco 1 + 2): exige motivo
 * (o PDF do cronograma é opcional), calcula o diff campo a campo e grava
 * tudo em project_change_history apontando para o documento anexado,
 * quando houver.
 *
 * Faturamento (Bloco 3) não passa mais por aqui — tem seu próprio fluxo em
 * updateBillingEvents(), sem exigir PDF/motivo (mesma tela de Configuração).
 *
 * Sem transação de banco (supabase-js não expõe uma pela REST API) — os
 * passos rodam em sequência. Risco aceito por ora; revisitar com uma
 * função Postgres (RPC) se isso virar problema real.
 */
export async function updateProject(
  projectId: string,
  input: ProjectFormInput,
  opts: { reason: string; documentFile: File | null; userId: string }
) {
  const supabase = await createClient();

  const [
    { data: oldProject, error: projectError },
    { data: oldPayments, error: paymentsError },
    { data: latestDoc, error: docsError },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("payment_events").select("*").eq("project_id", projectId),
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
  if (docsError) throw docsError;

  const changes = [
    ...diffGeneralFields(oldProject, input.general),
    ...diffPaymentEvents(oldPayments ?? [], input.paymentEvents),
  ];
  if (changes.length === 0) {
    throw new Error("Nenhuma alteração para salvar.");
  }

  let documentId: string | null = null;
  if (opts.documentFile) {
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
    documentId = document.id;
  }

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
    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "Não é possível remover um evento de pagamento que já tem faturamento lançado. Remova o faturamento no bloco 3 desta mesma tela primeiro."
        );
      }
      throw error;
    }
  }
  for (const event of input.paymentEvents) {
    const row = toPaymentEventRow(event, projectId);
    const { error } = event.id
      ? await supabase.from("payment_events").update(row).eq("id", event.id)
      : await supabase.from("payment_events").insert(row);
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
        document_id: documentId,
      }))
    );
  if (historyError) throw historyError;

  return { changesCount: changes.length };
}

/**
 * Salva o Bloco 3 (Faturamento) na tela de Configuração. Sem PDF/motivo —
 * não é uma mudança de cronograma, é uma atualização operacional de
 * faturamento. Ainda registra o diff em project_change_history (sem
 * documento/motivo associado) para manter rastreabilidade de quem mudou
 * o quê e quando.
 *
 * O Status (Pago/Não pago) de cada linha grava paid_date/paid_amount no
 * payment_event vinculado — é o único lugar da interface que preenche
 * esses campos, e são eles que alimentam o KPI "Pago" do Consolidado.
 */
function paidStatusLabel(paidDate: string | null | undefined) {
  return paidDate ? `Pago em ${paidDate}` : "Não pago";
}

export async function updateBillingEvents(
  projectId: string,
  billingEvents: BillingEventInput[],
  userId: string
) {
  const supabase = await createClient();

  const [
    { data: oldBillings, error: billingsError },
    { data: paymentEvents, error: paymentsError },
  ] = await Promise.all([
    supabase.from("billing_events").select("*").eq("project_id", projectId),
    supabase.from("payment_events").select("*").eq("project_id", projectId),
  ]);
  if (billingsError) throw billingsError;
  if (paymentsError) throw paymentsError;

  const paymentById = new Map(
    (paymentEvents ?? []).map((p) => [p.id, p])
  );

  const changes = diffBillingEvents(oldBillings ?? [], billingEvents);

  for (const event of billingEvents) {
    const pe = paymentById.get(event.payment_event_id);
    const oldPaidDate = pe?.paid_date ?? null;
    const newPaidDate = event.status === "pago" ? event.paid_date ?? null : null;
    if (oldPaidDate !== newPaidDate) {
      changes.push({
        field_name: `Pagamento "${pe?.payment_event ?? ""}" — status de pagamento`,
        old_value: paidStatusLabel(oldPaidDate),
        new_value: paidStatusLabel(newPaidDate),
      });
    }
    if (Boolean(pe?.po_issued) !== event.po_issued) {
      changes.push({
        field_name: `Pagamento "${pe?.payment_event ?? ""}" — PO emitida`,
        old_value: pe?.po_issued ? "Sim" : "Não",
        new_value: event.po_issued ? "Sim" : "Não",
      });
    }
  }

  if (changes.length === 0) {
    throw new Error("Nenhuma alteração para salvar.");
  }

  const keptIds = billingEvents
    .map((e) => e.id)
    .filter((id): id is string => Boolean(id));
  const idsToDelete = (oldBillings ?? [])
    .map((b) => b.id)
    .filter((id) => !keptIds.includes(id));
  if (idsToDelete.length > 0) {
    const { error } = await supabase
      .from("billing_events")
      .delete()
      .in("id", idsToDelete);
    if (error) throw error;
  }
  for (const event of billingEvents) {
    const row = toBillingEventRow(event, projectId);
    const { error } = event.id
      ? await supabase.from("billing_events").update(row).eq("id", event.id)
      : await supabase.from("billing_events").insert(row);
    if (error) throw error;

    const paidUpdate = {
      ...(event.status === "pago"
        ? { paid_date: event.paid_date ?? null, paid_amount: row.billed_amount }
        : { paid_date: null, paid_amount: null }),
      po_issued: event.po_issued,
    };
    const { error: paidError } = await supabase
      .from("payment_events")
      .update(paidUpdate)
      .eq("id", event.payment_event_id);
    if (paidError) throw paidError;
  }

  const { error: historyError } = await supabase
    .from("project_change_history")
    .insert(
      changes.map((change) => ({
        project_id: projectId,
        user_id: userId,
        field_name: change.field_name,
        old_value: change.old_value,
        new_value: change.new_value,
        change_reason: null,
        document_id: null,
      }))
    );
  if (historyError) throw historyError;

  return { changesCount: changes.length };
}
