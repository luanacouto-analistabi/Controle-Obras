"use client";

import { useActionState, useState } from "react";
import {
  saveFinalInvoiceItemsAction,
  uploadFinalInvoiceDocumentAction,
  type FinalInvoiceActionState,
} from "@/lib/actions/final-invoice";
import type { FinalInvoiceCategory } from "@/lib/constants/final-invoice";
import type { FinalInvoiceCategoryData } from "@/lib/services/final-invoice";
import type { FinalInvoiceItemInput } from "@/lib/validators/final-invoice";
import { cn, formatCurrencyBRL, parseBRLNumber } from "@/lib/utils";

const inputClass =
  "h-9 rounded-md border border-border bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent w-full";
const labelClass = "text-sm font-medium text-maua-navy";

const LEVEL_OPTIONS: Array<{ value: 1 | 2 | 3 | 4; label: string }> = [
  { value: 1, label: "1 · Seção" },
  { value: 2, label: "2 · Item" },
  { value: 3, label: "3 · Sublinha" },
  { value: 4, label: "4 · Observação" },
];

type RowState = FinalInvoiceItemInput & { key: string };

function emptyRow(): RowState {
  return {
    key: crypto.randomUUID(),
    level: 2,
    item: "",
    os: "",
    description: "",
    qty: "",
    unit: "",
    unit_price: "",
    total_price: "",
    updated_qty: "",
    updated_value: "",
    estaleiro_notes: "",
  };
}

function rowsFromData(data: FinalInvoiceCategoryData): RowState[] {
  return data.items.map((item) => ({
    key: item.id,
    level: item.level ?? 2,
    item: item.item ?? "",
    os: item.os ?? "",
    description: item.description ?? "",
    qty: item.qty ?? "",
    unit: item.unit ?? "",
    unit_price: item.unit_price ?? "",
    total_price: item.total_price ?? "",
    updated_qty: item.updated_qty ?? "",
    updated_value: item.updated_value ?? "",
    estaleiro_notes: item.estaleiro_notes ?? "",
  }));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Subtotal de "Preço total R$" por seção (nível 1) — soma os itens (nível 2) até a próxima seção. */
function computeSectionSubtotals(rows: RowState[]): Map<string, number> {
  const subtotals = new Map<string, number>();
  let currentKey: string | null = null;
  let currentSum = 0;
  const flush = () => {
    if (currentKey !== null) subtotals.set(currentKey, currentSum);
  };
  for (const row of rows) {
    if (row.level === 1) {
      flush();
      currentKey = row.key;
      currentSum = 0;
    } else if (row.level === 2) {
      currentSum += parseBRLNumber(row.total_price);
    }
  }
  flush();
  return subtotals;
}

const ROW_STYLE: Record<1 | 2 | 3 | 4, string> = {
  1: "bg-maua-navy/5 font-bold text-maua-navy",
  2: "font-semibold text-maua-navy",
  3: "text-maua-gray-500",
  4: "text-maua-gray-400 italic",
};

const DESCRIPTION_INDENT: Record<1 | 2 | 3 | 4, string> = {
  1: "pl-1",
  2: "pl-1",
  3: "pl-6",
  4: "pl-10",
};

export function FinalInvoiceCategoryPanel({
  projectId,
  category,
  data,
}: {
  projectId: string;
  category: FinalInvoiceCategory;
  data: FinalInvoiceCategoryData | null;
}) {
  const uploadAction = uploadFinalInvoiceDocumentAction.bind(
    null,
    projectId,
    category
  );
  const [uploadState, uploadFormAction, uploadPending] = useActionState<
    FinalInvoiceActionState,
    FormData
  >(uploadAction, undefined);

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h3 className="mb-1 text-base font-bold text-maua-navy">{category}</h3>
        <p className="mb-4 text-sm text-maua-gray-500">
          Envie o PDF da lista de preços desta categoria (modelo Estaleiro
          Mauá) para tabular os itens automaticamente.
        </p>
        <form
          action={uploadFormAction}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Arquivo PDF</span>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              required
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={uploadPending}
            className="h-9 rounded-lg bg-[#F18213] px-4 text-sm font-bold text-white hover:bg-[#D9730D] disabled:opacity-60"
          >
            {uploadPending ? "Enviando…" : "Enviar PDF"}
          </button>
        </form>
        {uploadState?.error && (
          <p className="mt-3 text-sm font-semibold text-red-600">
            {uploadState.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <FinalInvoiceItemsEditor
      projectId={projectId}
      category={category}
      data={data}
      uploadFormAction={uploadFormAction}
      uploadPending={uploadPending}
      uploadError={uploadState?.error}
    />
  );
}

function FinalInvoiceItemsEditor({
  projectId,
  category,
  data,
  uploadFormAction,
  uploadPending,
  uploadError,
}: {
  projectId: string;
  category: FinalInvoiceCategory;
  data: FinalInvoiceCategoryData;
  uploadFormAction: (formData: FormData) => void;
  uploadPending: boolean;
  uploadError: string | undefined;
}) {
  const [rows, setRows] = useState<RowState[]>(() => rowsFromData(data));
  const [showReupload, setShowReupload] = useState(false);
  // Uma reenvio de PDF troca o conteúdo tabulado sem trocar o id do
  // documento (upsert por project_id+category) — usa uploaded_at pra
  // detectar isso e resetar a tabela local durante a renderização, sem
  // efeito (evita o cascading render de setState em useEffect).
  const [syncedAt, setSyncedAt] = useState(data.document.uploaded_at);
  if (syncedAt !== data.document.uploaded_at) {
    setSyncedAt(data.document.uploaded_at);
    setRows(rowsFromData(data));
  }

  const saveAction = saveFinalInvoiceItemsAction.bind(
    null,
    data.document.id,
    projectId
  );
  const [saveState, saveFormAction, savePending] = useActionState<
    FinalInvoiceActionState,
    FormData
  >(saveAction, undefined);

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  const sectionSubtotals = computeSectionSubtotals(rows);

  const itemsJson = JSON.stringify(
    rows.map((row) => ({
      level: row.level,
      item: row.item,
      os: row.os,
      description: row.description,
      qty: row.qty,
      unit: row.unit,
      unit_price: row.unit_price,
      // Nível 1 nunca digita o próprio total — é sempre a soma ao vivo dos
      // itens (nível 2) daquela seção, gravada assim pra não desalinhar.
      total_price:
        row.level === 1
          ? String(sectionSubtotals.get(row.key) ?? 0)
          : row.total_price,
      updated_qty: row.updated_qty,
      updated_value: row.updated_value,
      estaleiro_notes: row.estaleiro_notes,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <div>
          <h3 className="text-base font-bold text-maua-navy">{category}</h3>
          <p className="text-sm text-maua-gray-500">
            {data.document.file_name}
            {" · enviado em "}
            {formatDateTime(data.document.uploaded_at)}
            {data.signedUrl && (
              <>
                {" · "}
                <a
                  href={data.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-maua-navy hover:underline"
                >
                  ver PDF
                </a>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowReupload((v) => !v)}
          className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-bold text-maua-navy hover:bg-maua-gray-100"
        >
          {showReupload ? "Cancelar" : "Reenviar PDF"}
        </button>
      </div>

      {showReupload && (
        <form
          action={uploadFormAction}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-[#F18213]/40 bg-surface p-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Novo arquivo PDF</span>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              required
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={uploadPending}
            className="h-9 rounded-lg bg-[#F18213] px-4 text-sm font-bold text-white hover:bg-[#D9730D] disabled:opacity-60"
          >
            {uploadPending ? "Enviando…" : "Substituir e retabular"}
          </button>
          <p className="w-full text-xs text-maua-gray-500">
            Substitui o PDF e as linhas tabuladas desta categoria — as 3
            colunas extras preenchidas serão perdidas.
          </p>
        </form>
      )}
      {uploadError && (
        <p className="text-sm font-semibold text-red-600">{uploadError}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
        <table className="w-full min-w-[1500px] border-collapse text-sm">
          <thead>
            <tr>
              {[
                "Nível",
                "Item",
                "OS",
                "Descrição",
                "Qtd",
                "Unit",
                "Preço unit. R$",
                "Preço total R$",
                "Quantidade Atualizada",
                "Valor Atualizado",
                "Observações do Estaleiro (Se aplicável)",
                "",
              ].map((label) => (
                <th
                  key={label}
                  className="border-b border-border bg-maua-gray-50 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSection = row.level === 1;
              return (
                <tr
                  key={row.key}
                  className={cn(
                    "hover:bg-maua-gray-50",
                    isSection && "border-t-2 border-t-maua-navy/30"
                  )}
                >
                  <td className="border-b border-border p-1">
                    <select
                      value={row.level}
                      onChange={(e) =>
                        updateRow(row.key, {
                          level: Number(e.target.value) as RowState["level"],
                        })
                      }
                      className={`${inputClass} w-32`}
                    >
                      {LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-border p-1">
                    <input
                      value={row.item}
                      onChange={(e) =>
                        updateRow(row.key, { item: e.target.value })
                      }
                      className={`${inputClass} w-16 ${ROW_STYLE[row.level]}`}
                    />
                  </td>
                  <td className="border-b border-border p-1">
                    <input
                      value={row.os}
                      onChange={(e) =>
                        updateRow(row.key, { os: e.target.value })
                      }
                      className={`${inputClass} w-20`}
                    />
                  </td>
                  <td className="border-b border-border p-1">
                    <input
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.key, { description: e.target.value })
                      }
                      className={`${inputClass} min-w-[260px] ${DESCRIPTION_INDENT[row.level]} ${ROW_STYLE[row.level]}`}
                    />
                  </td>
                  <td className="border-b border-border p-1">
                    <input
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(row.key, { qty: e.target.value })
                      }
                      className={`${inputClass} w-20`}
                    />
                  </td>
                  <td className="border-b border-border p-1">
                    <input
                      value={row.unit}
                      onChange={(e) =>
                        updateRow(row.key, { unit: e.target.value })
                      }
                      className={`${inputClass} w-24`}
                    />
                  </td>
                  <td className="border-b border-border p-1">
                    <input
                      value={row.unit_price}
                      onChange={(e) =>
                        updateRow(row.key, { unit_price: e.target.value })
                      }
                      disabled={isSection}
                      className={`${inputClass} w-28 disabled:bg-maua-gray-50`}
                    />
                  </td>
                  <td className="border-b border-border p-1">
                    {isSection ? (
                      <div className="flex h-9 w-32 items-center justify-end rounded-md bg-maua-gray-100 px-2 text-sm font-bold text-maua-navy tabular-nums">
                        {formatCurrencyBRL(sectionSubtotals.get(row.key) ?? 0)}
                      </div>
                    ) : (
                      <input
                        value={row.total_price}
                        onChange={(e) =>
                          updateRow(row.key, { total_price: e.target.value })
                        }
                        className={`${inputClass} w-28`}
                      />
                    )}
                  </td>
                  <td className="border-b border-l border-[#F18213]/40 bg-[#F18213]/5 p-1">
                    <input
                      value={row.updated_qty}
                      onChange={(e) =>
                        updateRow(row.key, { updated_qty: e.target.value })
                      }
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="border-b border-[#F18213]/40 bg-[#F18213]/5 p-1">
                    <input
                      value={row.updated_value}
                      onChange={(e) =>
                        updateRow(row.key, { updated_value: e.target.value })
                      }
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="border-b border-[#F18213]/40 bg-[#F18213]/5 p-1">
                    <input
                      value={row.estaleiro_notes}
                      onChange={(e) =>
                        updateRow(row.key, {
                          estaleiro_notes: e.target.value,
                        })
                      }
                      className={`${inputClass} min-w-[220px]`}
                    />
                  </td>
                  <td className="border-b border-border p-1 text-right">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setRows((current) => [...current, emptyRow()])}
          className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-bold text-maua-navy hover:bg-maua-gray-100"
        >
          + Adicionar linha
        </button>

        <form action={saveFormAction} className="flex items-center gap-3">
          <input type="hidden" name="items" value={itemsJson} />
          {saveState?.error && (
            <p className="text-sm font-semibold text-red-600">
              {saveState.error}
            </p>
          )}
          {saveState?.success && !saveState.error && (
            <p className="text-sm font-semibold text-[#1B5E37]">
              Tabela salva.
            </p>
          )}
          <button
            type="submit"
            disabled={savePending}
            className="h-10 rounded-lg bg-maua-navy px-6 text-sm font-bold text-white hover:bg-[#2D3F4A] disabled:opacity-60"
          >
            {savePending ? "Salvando…" : "Salvar tabela"}
          </button>
        </form>
      </div>
    </div>
  );
}
