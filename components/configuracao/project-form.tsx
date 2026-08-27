"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/projects";
import type { PaymentEvent, Project } from "@/types/database.types";

type PaymentRowState = {
  key: string;
  id?: string;
  payment_event: string;
  invoice_description: string;
  invoice_date: string;
  payment_condition: string;
  expected_payment_date: string;
  amount: string;
  measurement_date: string;
  po_issued: boolean;
  invoice_number: string;
};

function newPaymentRow(): PaymentRowState {
  return {
    key: crypto.randomUUID(),
    payment_event: "",
    invoice_description: "",
    invoice_date: "",
    payment_condition: "",
    expected_payment_date: "",
    amount: "",
    measurement_date: "",
    po_issued: false,
    invoice_number: "",
  };
}

function paymentRowFromEvent(event: PaymentEvent): PaymentRowState {
  return {
    key: event.id,
    id: event.id,
    payment_event: event.payment_event,
    invoice_description: event.invoice_description ?? "",
    invoice_date: event.invoice_date ?? "",
    payment_condition: event.payment_condition ?? "",
    expected_payment_date: event.expected_payment_date ?? "",
    amount: String(event.amount),
    measurement_date: event.measurement_date ?? "",
    po_issued: event.po_issued,
    invoice_number: event.invoice_number ?? "",
  };
}

const inputClass =
  "h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-accent/50 focus-visible:border-accent w-full";
const labelClass = "text-sm font-medium text-maua-navy";

type ProjectFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      project: Project;
      paymentEvents: PaymentEvent[];
    };

export function ProjectForm(props: ProjectFormProps) {
  const isEdit = props.mode === "edit";
  const action = isEdit
    ? updateProjectAction.bind(null, props.project.id)
    : createProjectAction;
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(action, undefined);

  const [paymentRows, setPaymentRows] = useState<PaymentRowState[]>(() =>
    isEdit ? props.paymentEvents.map(paymentRowFromEvent) : []
  );

  function updatePaymentRow(
    key: string,
    patch: Partial<PaymentRowState>
  ) {
    setPaymentRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  const paymentEventsJson = JSON.stringify(
    paymentRows.map((row) => ({
      id: row.id,
      payment_event: row.payment_event,
      invoice_description: row.invoice_description || null,
      invoice_date: row.invoice_date || null,
      payment_condition: row.payment_condition || null,
      expected_payment_date: row.expected_payment_date || null,
      amount: Number(row.amount || 0),
      measurement_date: row.measurement_date || null,
      po_issued: row.po_issued,
      invoice_number: row.invoice_number || null,
    }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="paymentEvents" value={paymentEventsJson} />

      {/* Bloco 1 — Informações Gerais */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-maua-navy">
          1. Informações Gerais
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>CC</span>
            <input
              name="cc"
              required
              pattern="\d{6}"
              title="6 dígitos, sem ponto"
              placeholder="020227"
              defaultValue={isEdit ? props.project.cc : ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Coordenador de Projeto</span>
            <input
              name="project_coordinator"
              required
              defaultValue={isEdit ? props.project.project_coordinator : ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Cliente</span>
            <input
              name="client"
              required
              defaultValue={isEdit ? props.project.client : ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Nome da Embarcação</span>
            <input
              name="vessel_name"
              required
              defaultValue={isEdit ? props.project.vessel_name : ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Data Início</span>
            <input
              type="date"
              name="start_date"
              required
              defaultValue={isEdit ? props.project.start_date : ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Data Fim</span>
            <input
              type="date"
              name="end_date"
              required
              defaultValue={isEdit ? props.project.end_date : ""}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* Bloco 2 — Informações de Pagamento */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-maua-navy">
            2. Informações de Pagamento
          </h2>
          <button
            type="button"
            onClick={() => setPaymentRows((rows) => [...rows, newPaymentRow()])}
            className="h-8 rounded-lg bg-maua-navy px-3 text-xs font-bold text-white hover:bg-[#2D3F4A]"
          >
            + Adicionar pagamento
          </button>
        </div>

        {paymentRows.length === 0 && (
          <p className="text-sm text-maua-gray-500">
            Nenhum evento de pagamento adicionado ainda.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {paymentRows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-maua-navy/70">
                  Pagamento {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentRows((rows) =>
                      rows.filter((r) => r.key !== row.key)
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Evento de pagamento</span>
                  <input
                    required
                    value={row.payment_event}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        payment_event: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Descrição da Invoice</span>
                  <input
                    value={row.invoice_description}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        invoice_description: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Nº da Invoice</span>
                  <input
                    value={row.invoice_number}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        invoice_number: e.target.value,
                      })
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
                      updatePaymentRow(row.key, {
                        invoice_date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Condição de pagamento</span>
                  <input
                    placeholder="ex.: 10 dias"
                    value={row.payment_condition}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        payment_condition: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Data Prevista de Pagamento</span>
                  <input
                    type="date"
                    value={row.expected_payment_date}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        expected_payment_date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Valor (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={row.amount}
                    onChange={(e) =>
                      updatePaymentRow(row.key, { amount: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Data da Medição</span>
                  <input
                    type="date"
                    value={row.measurement_date}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        measurement_date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={row.po_issued}
                    onChange={(e) =>
                      updatePaymentRow(row.key, {
                        po_issued: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#F18213]"
                  />
                  <span className={labelClass}>PO emitida</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isEdit && (
        <>
          <div className="rounded-xl border border-dashed border-border bg-white p-4 text-sm text-maua-gray-500 shadow-card">
            Faturamento (Bloco 3) mudou de lugar —{" "}
            <Link
              href={`/faturamento/${props.project.id}`}
              className="font-semibold text-maua-navy hover:underline"
            >
              atualize em &ldquo;Atualização Faturamento&rdquo;
            </Link>
            .
          </div>

          <section className="rounded-xl border border-[#F18213]/40 bg-[#F18213]/5 p-6 shadow-card">
            <h2 className="mb-1 text-base font-bold text-maua-navy">
              Confirmar alteração
            </h2>
            <p className="mb-4 text-sm text-maua-gray-500">
              Toda alteração exige o cronograma atualizado e o motivo — isso
              fica registrado no histórico do projeto.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Cronograma atualizado (PDF)</span>
                <input
                  type="file"
                  name="document"
                  accept="application/pdf"
                  required
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Motivo da alteração/postergação
                </span>
                <input
                  name="change_reason"
                  required
                  placeholder="ex.: Atraso na aprovação do cliente"
                  className={inputClass}
                />
              </label>
            </div>
          </section>
        </>
      )}

      {state?.error && (
        <p className="text-sm font-semibold text-red-600">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-maua-navy px-6 text-sm font-bold text-white transition-colors hover:bg-[#2D3F4A] disabled:opacity-60"
        >
          {pending
            ? "Salvando…"
            : isEdit
              ? "Salvar alteração"
              : "Criar projeto"}
        </button>
      </div>
    </form>
  );
}
