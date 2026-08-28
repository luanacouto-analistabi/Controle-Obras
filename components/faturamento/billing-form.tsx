"use client";

import { useActionState, useState, type FormEvent } from "react";
import { updateBillingEventsAction, type BillingFormState } from "@/lib/actions/billing";
import { formatCurrencyBRL } from "@/lib/utils";
import type { BillingEvent, PaymentEvent } from "@/types/database.types";

type BillingRowState = {
  key: string;
  id?: string;
  payment_event_ids: string[];
  billing_date: string;
  invoice_number: string;
  invoice_date: string;
  new_billing_date: string;
  status: "pago" | "nao_pago";
  paid_date: string;
};

function newBillingRow(): BillingRowState {
  return {
    key: crypto.randomUUID(),
    payment_event_ids: [],
    billing_date: "",
    invoice_number: "",
    invoice_date: "",
    new_billing_date: "",
    status: "nao_pago",
    paid_date: "",
  };
}

function billingRowFromEvent(
  event: BillingEvent,
  linkedPaymentEvent: PaymentEvent | undefined
): BillingRowState {
  return {
    key: event.id,
    id: event.id,
    payment_event_ids: event.payment_event_id ? [event.payment_event_id] : [],
    billing_date: event.billing_date,
    invoice_number: event.invoice_number ?? "",
    invoice_date: event.invoice_date ?? "",
    new_billing_date: event.new_billing_date ?? "",
    status: linkedPaymentEvent?.paid_date ? "pago" : "nao_pago",
    paid_date: linkedPaymentEvent?.paid_date ?? "",
  };
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T00:00:00`));
}

const inputClass =
  "h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-accent/50 focus-visible:border-accent w-full";
const labelClass = "text-sm font-medium text-maua-navy";

export function BillingForm({
  projectId,
  paymentEvents,
  billingEvents,
}: {
  projectId: string;
  paymentEvents: PaymentEvent[];
  billingEvents: BillingEvent[];
}) {
  const action = updateBillingEventsAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState<
    BillingFormState,
    FormData
  >(action, undefined);

  const paymentEventById = new Map(paymentEvents.map((pe) => [pe.id, pe]));

  const [rows, setRows] = useState<BillingRowState[]>(() =>
    billingEvents.map((event) =>
      billingRowFromEvent(
        event,
        event.payment_event_id
          ? paymentEventById.get(event.payment_event_id)
          : undefined
      )
    )
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const emptyIndex = rows.findIndex(
      (row) => row.payment_event_ids.length === 0
    );
    if (emptyIndex !== -1) {
      event.preventDefault();
      setClientError(
        `Selecione ao menos uma parcela no Faturamento ${emptyIndex + 1}.`
      );
      return;
    }
    setClientError(null);
  }

  function updateRow(key: string, patch: Partial<BillingRowState>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  const billingEventsJson = JSON.stringify(
    rows.flatMap((row) =>
      row.payment_event_ids.map((paymentEventId, index) => ({
        // Uma parcela por registro em billing_events: quando várias parcelas
        // são marcadas no mesmo bloco, a primeira reaproveita o id existente
        // (update) e as demais viram novos registros (insert). O valor
        // faturado vem do próprio evento de pagamento selecionado, não é
        // digitado.
        id: index === 0 ? row.id : undefined,
        payment_event_id: paymentEventId,
        billing_date: row.billing_date,
        billed_amount: paymentEventById.get(paymentEventId)?.amount ?? 0,
        invoice_number: row.invoice_number || null,
        invoice_date: row.invoice_date || null,
        new_billing_date: row.new_billing_date || null,
        status: row.status,
        paid_date: row.status === "pago" ? row.paid_date || null : null,
      }))
    )
  );

  const hasPaymentEvents = paymentEvents.length > 0;
  const editingRow = rows.find((row) => row.key === editingKey) ?? null;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="billingEvents" value={billingEventsJson} />

      <section className="rounded-xl border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-maua-navy">
            3. Informações de Faturamento
          </h2>
          <button
            type="button"
            disabled={!hasPaymentEvents}
            onClick={() => {
              const row = newBillingRow();
              setRows((current) => [...current, row]);
              setEditingKey(row.key);
            }}
            className="h-8 rounded-lg bg-maua-navy px-3 text-xs font-bold text-white hover:bg-[#2D3F4A] disabled:opacity-40"
          >
            + Adicionar faturamento
          </button>
        </div>

        {!hasPaymentEvents && (
          <p className="text-sm text-maua-gray-500">
            Nenhum evento de pagamento cadastrado neste projeto — adicione
            pelo menos um na Configuração antes de lançar faturamento.
          </p>
        )}

        {hasPaymentEvents && rows.length === 0 && (
          <p className="text-sm text-maua-gray-500">
            Nenhum registro de faturamento ainda.
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    "Evento(s) de pagamento",
                    "Nº Invoice",
                    "Data Faturamento",
                    "Valor Faturado",
                    "Status",
                    "Data Real de Pagamento",
                    "",
                  ].map((label) => (
                    <th
                      key={label}
                      className="border-b border-border bg-maua-gray-50 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const events = row.payment_event_ids
                    .map((id) => paymentEventById.get(id)?.payment_event)
                    .filter(Boolean);
                  const total = row.payment_event_ids.reduce(
                    (sum, id) => sum + (paymentEventById.get(id)?.amount ?? 0),
                    0
                  );
                  return (
                    <tr key={row.key} className="hover:bg-maua-gray-50">
                      <td className="border-b border-border px-3 py-2">
                        {events.length > 0 ? events.join(", ") : "–"}
                      </td>
                      <td className="border-b border-border px-3 py-2">
                        {row.invoice_number || "–"}
                      </td>
                      <td className="border-b border-border px-3 py-2 tabular-nums">
                        {formatDate(row.billing_date)}
                      </td>
                      <td className="border-b border-border px-3 py-2 text-right tabular-nums">
                        {formatCurrencyBRL(total)}
                      </td>
                      <td className="border-b border-border px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            row.status === "pago"
                              ? "bg-[#9AD595]/40 text-[#1B5E37]"
                              : "bg-[#DFA1AA]/40 text-[#7C2737]"
                          }`}
                        >
                          {row.status === "pago" ? "Pago" : "Não pago"}
                        </span>
                      </td>
                      <td className="border-b border-border px-3 py-2 tabular-nums">
                        {row.status === "pago" ? formatDate(row.paid_date) : "–"}
                      </td>
                      <td className="border-b border-border px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingKey(row.key)}
                          className="text-xs font-semibold text-maua-navy hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editingRow && (
          <div className="mt-4 rounded-lg border border-[#F18213]/40 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-maua-navy/70">
                {editingRow.id ? "Editar faturamento" : "Novo faturamento"}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) =>
                      current.filter((r) => r.key !== editingRow.key)
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remover
                </button>
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="text-xs font-semibold text-maua-navy hover:underline"
                >
                  Concluir edição
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-col gap-1.5">
              <span className={labelClass}>
                Evento de pagamento (selecione um ou mais)
              </span>
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-white p-2">
                {paymentEvents.map((pe) => {
                  const checked = editingRow.payment_event_ids.includes(pe.id);
                  return (
                    <label
                      key={pe.id}
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-maua-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          updateRow(editingRow.key, {
                            payment_event_ids: checked
                              ? editingRow.payment_event_ids.filter(
                                  (id) => id !== pe.id
                                )
                              : [...editingRow.payment_event_ids, pe.id],
                          })
                        }
                        className="h-4 w-4 accent-[#F18213]"
                      />
                      <span>
                        {pe.payment_event} —{" "}
                        {pe.invoice_description || "Sem descrição"} —{" "}
                        {formatCurrencyBRL(pe.amount)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Data de Faturamento</span>
                <input
                  type="date"
                  required
                  value={editingRow.billing_date}
                  onChange={(e) =>
                    updateRow(editingRow.key, { billing_date: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Nº da Invoice</span>
                <input
                  value={editingRow.invoice_number}
                  onChange={(e) =>
                    updateRow(editingRow.key, { invoice_number: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Data da Invoice</span>
                <input
                  type="date"
                  value={editingRow.invoice_date}
                  onChange={(e) =>
                    updateRow(editingRow.key, { invoice_date: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Nova Data de Faturamento</span>
                <input
                  type="date"
                  value={editingRow.new_billing_date}
                  onChange={(e) =>
                    updateRow(editingRow.key, {
                      new_billing_date: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Status</span>
                <select
                  value={editingRow.status}
                  onChange={(e) =>
                    updateRow(editingRow.key, {
                      status: e.target.value as BillingRowState["status"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="nao_pago">Não pago</option>
                  <option value="pago">Pago</option>
                </select>
              </label>
              {editingRow.status === "pago" && (
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Data Real de Pagamento</span>
                  <input
                    type="date"
                    value={editingRow.paid_date}
                    onChange={(e) =>
                      updateRow(editingRow.key, { paid_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </section>

      {(clientError || state?.error) && (
        <p className="text-sm font-semibold text-red-600">
          {clientError ?? state?.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-maua-navy px-6 text-sm font-bold text-white transition-colors hover:bg-[#2D3F4A] disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar faturamento"}
        </button>
      </div>
    </form>
  );
}
