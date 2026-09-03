"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/projects";
import type { PaymentEvent, Project } from "@/types/database.types";
import type { CentroCusto } from "@/lib/services/maua-scp";

type PaymentRowState = {
  key: string;
  id?: string;
  payment_event: string;
  invoice_description: string;
  payment_condition: string;
  expected_payment_date: string;
  amount: string;
  status:
    | "previsto"
    | "em_discussao"
    | "aprovado"
    | "po_nao_emitida"
    | "po_sem_saldo";
  measurement_status: "aprovada" | "em_discussao" | "prevista";
  po_issued: boolean;
};

const STATUS_OPTIONS: Array<{
  value: PaymentRowState["status"];
  label: string;
}> = [
  { value: "previsto", label: "Previsto" },
  { value: "em_discussao", label: "Em discussão" },
  { value: "aprovado", label: "Aprovado" },
  { value: "po_nao_emitida", label: "PO não emitida" },
  { value: "po_sem_saldo", label: "PO sem saldo" },
];

const PAYMENT_EVENT_OPTIONS = [
  "Parcela Contratual",
  "VOR - 50%",
  "VOR - 100%",
];

function newPaymentRow(): PaymentRowState {
  return {
    key: crypto.randomUUID(),
    payment_event: "",
    invoice_description: "",
    payment_condition: "",
    expected_payment_date: "",
    amount: "",
    status: "previsto",
    measurement_status: "prevista",
    po_issued: false,
  };
}

function paymentRowFromEvent(event: PaymentEvent): PaymentRowState {
  return {
    key: event.id,
    id: event.id,
    payment_event: event.payment_event,
    invoice_description: event.invoice_description ?? "",
    payment_condition: event.payment_condition ?? "",
    expected_payment_date: event.expected_payment_date ?? "",
    amount: String(event.amount),
    status: event.status,
    measurement_status: event.measurement_status,
    po_issued: event.po_issued,
  };
}

const PROJECT_COORDINATORS = [
  "Janderson Santos",
  "Alexandre Trindade",
  "Bruno Cabral",
  "Bruno Contildes",
  "Wallace Guinim",
  "Uriel Rodrigues",
  "Carlos Macedo",
];

const inputClass =
  "h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-accent/50 focus-visible:border-accent w-full";
const labelClass = "text-sm font-medium text-maua-navy";

type ProjectFormProps = {
  centrosCusto: CentroCusto[];
  vesselNamesByCc: Record<string, string[]>;
  variant?: "project" | "final-invoice";
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      project: Project;
      paymentEvents: PaymentEvent[];
      billingSection?: ReactNode;
    }
);

export function ProjectForm(props: ProjectFormProps) {
  const isEdit = props.mode === "edit";
  const variant = props.variant ?? "project";
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
  const [editingPaymentKey, setEditingPaymentKey] = useState<string | null>(
    null
  );

  const currentCc = isEdit ? props.project.cc : "";
  const [ccValue, setCcValue] = useState(currentCc);
  const ccOptions =
    currentCc && !props.centrosCusto.some((c) => c.codCcusto === currentCc)
      ? [
          { codCcusto: currentCc, descrCcusto: "(fora da lista atual da EAP)" },
          ...props.centrosCusto,
        ]
      : props.centrosCusto;

  const [coordinator, setCoordinator] = useState(
    isEdit ? props.project.project_coordinator : ""
  );
  const coordinatorOptions =
    coordinator && !PROJECT_COORDINATORS.includes(coordinator)
      ? [coordinator, ...PROJECT_COORDINATORS]
      : PROJECT_COORDINATORS;

  const currentVesselName = isEdit ? props.project.vessel_name : "";
  const [vesselName, setVesselName] = useState(currentVesselName);
  const vesselNamesForCc = props.vesselNamesByCc[ccValue] ?? [];
  const vesselNameOptions =
    vesselName && !vesselNamesForCc.includes(vesselName)
      ? [vesselName, ...vesselNamesForCc]
      : vesselNamesForCc;

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
      payment_condition: row.payment_condition || null,
      expected_payment_date: row.expected_payment_date || null,
      amount: Number(row.amount || 0),
      status: row.status,
      measurement_status: row.measurement_status,
      po_issued: row.po_issued,
    }))
  );

  const editingPaymentRow =
    paymentRows.find((row) => row.key === editingPaymentKey) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <form id="project-form" action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="paymentEvents" value={paymentEventsJson} />
        <input
          type="hidden"
          name="origin"
          value={variant === "final-invoice" ? "final-invoice" : "configuracao"}
        />

      {/* Bloco 1 — Informações Gerais */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-maua-navy">
          1. Informações Gerais
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>CC</span>
            <select
              name="cc"
              required
              value={ccValue}
              onChange={(e) => setCcValue(e.target.value)}
              disabled={ccOptions.length === 0}
              className={inputClass}
            >
              <option value="" disabled>
                {ccOptions.length === 0
                  ? "Não foi possível carregar os CCs da EAP"
                  : "Selecione..."}
              </option>
              {ccOptions.map((cc) => (
                <option key={cc.codCcusto} value={cc.codCcusto}>
                  {cc.codCcusto} — {cc.descrCcusto}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Coordenador de Projeto</span>
            <select
              name="project_coordinator"
              required
              value={coordinator}
              onChange={(e) => setCoordinator(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {coordinatorOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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
            <select
              name="vessel_name"
              required
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              disabled={vesselNameOptions.length === 0}
              className={inputClass}
            >
              <option value="" disabled>
                {vesselNameOptions.length === 0
                  ? ccValue
                    ? "Nenhuma opção da EAP para este CC"
                    : "Selecione o CC primeiro"
                  : "Selecione..."}
              </option>
              {vesselNameOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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
      {variant === "project" && (
      <section className="rounded-xl border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-maua-navy">
            2. Informações de Pagamento
          </h2>
          <button
            type="button"
            onClick={() => {
              const row = newPaymentRow();
              setPaymentRows((rows) => [...rows, row]);
              setEditingPaymentKey(row.key);
            }}
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

        {paymentRows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    "Evento de pagamento",
                    "Descrição da Invoice",
                    "Valor",
                    "Status",
                    "Data Prevista Pagamento",
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
                {paymentRows.map((row) => (
                  <tr key={row.key} className="hover:bg-maua-gray-50">
                    <td className="border-b border-border px-3 py-2">
                      {row.payment_event || "–"}
                    </td>
                    <td className="border-b border-border px-3 py-2">
                      {row.invoice_description || "–"}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-right tabular-nums">
                      {row.amount
                        ? Number(row.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "–"}
                    </td>
                    <td className="border-b border-border px-3 py-2">
                      {STATUS_OPTIONS.find((o) => o.value === row.status)
                        ?.label ?? row.status}
                    </td>
                    <td className="border-b border-border px-3 py-2 tabular-nums">
                      {row.expected_payment_date
                        ? new Intl.DateTimeFormat("pt-BR").format(
                            new Date(`${row.expected_payment_date}T00:00:00`)
                          )
                        : "–"}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingPaymentKey(row.key)}
                        className="text-xs font-semibold text-maua-navy hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingPaymentRow && (
          <div className="mt-4 rounded-lg border border-[#F18213]/40 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-maua-navy/70">
                {editingPaymentRow.id ? "Editar pagamento" : "Novo pagamento"}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentRows((rows) =>
                      rows.filter((r) => r.key !== editingPaymentRow.key)
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remover
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPaymentKey(null)}
                  className="text-xs font-semibold text-maua-navy hover:underline"
                >
                  Concluir edição
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Evento de pagamento</span>
                <select
                  required
                  value={editingPaymentRow.payment_event}
                  onChange={(e) =>
                    updatePaymentRow(editingPaymentRow.key, {
                      payment_event: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {(editingPaymentRow.payment_event &&
                  !PAYMENT_EVENT_OPTIONS.includes(
                    editingPaymentRow.payment_event
                  )
                    ? [editingPaymentRow.payment_event, ...PAYMENT_EVENT_OPTIONS]
                    : PAYMENT_EVENT_OPTIONS
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Descrição da Invoice</span>
                <input
                  value={editingPaymentRow.invoice_description}
                  onChange={(e) =>
                    updatePaymentRow(editingPaymentRow.key, {
                      invoice_description: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Condição de pagamento</span>
                <input
                  placeholder="ex.: 10 dias"
                  value={editingPaymentRow.payment_condition}
                  onChange={(e) =>
                    updatePaymentRow(editingPaymentRow.key, {
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
                  value={editingPaymentRow.expected_payment_date}
                  onChange={(e) =>
                    updatePaymentRow(editingPaymentRow.key, {
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
                  value={editingPaymentRow.amount}
                  onChange={(e) =>
                    updatePaymentRow(editingPaymentRow.key, {
                      amount: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Status</span>
                <select
                  value={editingPaymentRow.status}
                  onChange={(e) =>
                    updatePaymentRow(editingPaymentRow.key, {
                      status: e.target.value as PaymentRowState["status"],
                    })
                  }
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </section>
      )}
      </form>

      {isEdit && props.billingSection}

      {isEdit && (
        <section className="rounded-xl border border-[#F18213]/40 bg-[#F18213]/5 p-6 shadow-card">
          <h2 className="mb-1 text-base font-bold text-maua-navy">
            Confirmar alteração
          </h2>
          <p className="mb-4 text-sm text-maua-gray-500">
            Toda alteração exige o motivo — isso fica registrado no
            histórico do projeto. O anexo do cronograma atualizado (PDF) é
            opcional.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Cronograma atualizado (PDF) — opcional
              </span>
              <input
                type="file"
                name="document"
                form="project-form"
                accept="application/pdf"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Motivo da alteração/postergação
              </span>
              <input
                name="change_reason"
                form="project-form"
                required
                placeholder="ex.: Atraso na aprovação do cliente"
                className={inputClass}
              />
            </label>
          </div>
        </section>
      )}

      {state?.error && (
        <p className="text-sm font-semibold text-red-600">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          form="project-form"
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
    </div>
  );
}
