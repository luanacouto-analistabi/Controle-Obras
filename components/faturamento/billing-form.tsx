"use client";

import { useActionState, useState } from "react";
import { updateBillingEventsAction, type BillingFormState } from "@/lib/actions/billing";
import { formatCurrencyBRL } from "@/lib/utils";
import type { BillingEvent, PaymentEvent } from "@/types/database.types";

type BillingRowState = {
  key: string;
  id?: string;
  payment_event_id: string;
  billing_date: string;
  billed_amount: string;
  overdue_amount: string;
  new_billing_date: string;
};

function newBillingRow(): BillingRowState {
  return {
    key: crypto.randomUUID(),
    payment_event_id: "",
    billing_date: "",
    billed_amount: "",
    overdue_amount: "",
    new_billing_date: "",
  };
}

function billingRowFromEvent(event: BillingEvent): BillingRowState {
  return {
    key: event.id,
    id: event.id,
    payment_event_id: event.payment_event_id ?? "",
    billing_date: event.billing_date,
    billed_amount: String(event.billed_amount),
    overdue_amount: String(event.overdue_amount),
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

  function updateRow(key: string, patch: Partial<BillingRowState>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  const billingEventsJson = JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      payment_event_id: row.payment_event_id,
      billing_date: row.billing_date,
      billed_amount: Number(row.billed_amount || 0),
      overdue_amount: Number(row.overdue_amount || 0),
      new_billing_date: row.new_billing_date || null,
    }))
  );

  const hasPaymentEvents = paymentEvents.length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
                  Evento de pagamento (selecione um)
                </span>
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-white p-2">
                  {paymentEvents.map((pe) => (
                    <label
                      key={pe.id}
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-maua-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={row.payment_event_id === pe.id}
                        onChange={() =>
                          updateRow(row.key, { payment_event_id: pe.id })
                        }
                        className="h-4 w-4 accent-[#F18213]"
                      />
                      <span>
                        {pe.payment_event} — {formatCurrencyBRL(pe.amount)}
                      </span>
                    </label>
                  ))}
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
                  <span className={labelClass}>Faturado (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.billed_amount}
                    onChange={(e) =>
                      updateRow(row.key, { billed_amount: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Vencido (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.overdue_amount}
                    onChange={(e) =>
                      updateRow(row.key, { overdue_amount: e.target.value })
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

      {state?.error && (
        <p className="text-sm font-semibold text-red-600">{state.error}</p>
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
