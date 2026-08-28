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
};

function newBillingRow(): BillingRowState {
  return {
    key: crypto.randomUUID(),
    payment_event_ids: [],
    billing_date: "",
    invoice_number: "",
    invoice_date: "",
    new_billing_date: "",
  };
}

function billingRowFromEvent(event: BillingEvent): BillingRowState {
  return {
    key: event.id,
    id: event.id,
    payment_event_ids: event.payment_event_id ? [event.payment_event_id] : [],
    billing_date: event.billing_date,
    invoice_number: event.invoice_number ?? "",
    invoice_date: event.invoice_date ?? "",
    new_billing_date: event.new_billing_date ?? "",
  };
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

  const [rows, setRows] = useState<BillingRowState[]>(() =>
    billingEvents.map(billingRowFromEvent)
  );
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

  const paymentEventById = new Map(paymentEvents.map((pe) => [pe.id, pe]));

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
      }))
    )
  );

  const hasPaymentEvents = paymentEvents.length > 0;

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
            onClick={() => setRows((current) => [...current, newBillingRow()])}
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

        <div className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-maua-navy/70">
                  Faturamento {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) =>
                      current.filter((r) => r.key !== row.key)
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>

              <div className="mb-3 flex flex-col gap-1.5">
                <span className={labelClass}>
                  Evento de pagamento (selecione um ou mais)
                </span>
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-white p-2">
                  {paymentEvents.map((pe) => {
                    const checked = row.payment_event_ids.includes(pe.id);
                    return (
                      <label
                        key={pe.id}
                        className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-maua-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            updateRow(row.key, {
                              payment_event_ids: checked
                                ? row.payment_event_ids.filter(
                                    (id) => id !== pe.id
                                  )
                                : [...row.payment_event_ids, pe.id],
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
                    value={row.billing_date}
                    onChange={(e) =>
                      updateRow(row.key, { billing_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Nº da Invoice</span>
                  <input
                    value={row.invoice_number}
                    onChange={(e) =>
                      updateRow(row.key, { invoice_number: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Data da Invoice</span>
                  <input
                    type="date"
                    value={row.invoice_date}
                    onChange={(e) =>
                      updateRow(row.key, { invoice_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Nova Data de Faturamento</span>
                  <input
                    type="date"
                    value={row.new_billing_date}
                    onChange={(e) =>
                      updateRow(row.key, {
                        new_billing_date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
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
