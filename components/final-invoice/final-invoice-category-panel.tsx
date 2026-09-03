"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveFinalInvoiceItemsAction,
  uploadFinalInvoiceDocumentAction,
  type FinalInvoiceActionState,
} from "@/lib/actions/final-invoice";
import type { FinalInvoiceCategory } from "@/lib/constants/final-invoice";
import type { FinalInvoiceCategoryData } from "@/lib/services/final-invoice";
import type { FinalInvoiceItemInput } from "@/lib/validators/final-invoice";
import { formatCurrencyBRL, parseBRLNumber } from "@/lib/utils";

const inputClass =
  "h-9 rounded-md border border-border bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent w-full";
const labelClass = "text-sm font-medium text-maua-navy";

type RowState = FinalInvoiceItemInput & { key: string };

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

const TEXT_STYLE: Record<1 | 2 | 3 | 4, string> = {
  1: "font-bold uppercase text-maua-navy",
  2: "font-semibold text-maua-navy",
  3: "text-maua-gray-500",
  4: "text-[#A20000] italic",
};

const DESCRIPTION_INDENT: Record<1 | 2 | 3 | 4, string> = {
  1: "pl-0",
  2: "pl-0",
  3: "pl-6",
  4: "pl-10",
};

export function FinalInvoiceCategoryPanel({
  projectId,
  category,
  data,
  onSaved,
}: {
  projectId: string;
  category: FinalInvoiceCategory;
  data: FinalInvoiceCategoryData | null;
  onSaved?: () => void;
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
      onSaved={onSaved}
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
  onSaved,
}: {
  projectId: string;
  category: FinalInvoiceCategory;
  data: FinalInvoiceCategoryData;
  uploadFormAction: (formData: FormData) => void;
  uploadPending: boolean;
  uploadError: string | undefined;
  onSaved?: () => void;
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

  // Avança pro próximo menu assim que o salvamento é confirmado — aqui é
  // uma notificação pro componente pai (troca a aba dele), não um sync de
  // estado local, por isso o efeito é apropriado.
  useEffect(() => {
    if (saveState?.success && !saveState.error) {
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

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
        <table className="w-full min-w-[1300px] text-sm">
          <thead>
            <tr>
              {[
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
              ].map((label) => (
                <th
                  key={label}
                  className="bg-maua-gray-50 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70 first:rounded-tl-xl last:rounded-tr-xl"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isSection = row.level === 1;
              return (
                <tr
                  key={row.key}
                  className={
                    isSection
                      ? `bg-maua-navy/5 ${index > 0 ? "border-t-8 border-t-white" : ""}`
                      : "hover:bg-maua-gray-50"
                  }
                >
                  <td className={`px-3 py-2 align-top ${TEXT_STYLE[row.level]}`}>
                    {row.item}
                  </td>
                  <td className="px-3 py-2 align-top text-maua-gray-500">
                    {row.os}
                  </td>
                  <td
                    className={`px-3 py-2 align-top ${DESCRIPTION_INDENT[row.level]} ${TEXT_STYLE[row.level]}`}
                  >
                    {row.description}
                  </td>
                  <td className="px-3 py-2 align-top text-right tabular-nums text-maua-gray-500">
                    {row.qty}
                  </td>
                  <td className="px-3 py-2 align-top text-maua-gray-500">
                    {row.unit}
                  </td>
                  <td className="px-3 py-2 align-top text-right tabular-nums text-maua-gray-500">
                    {row.unit_price}
                  </td>
                  <td className="px-3 py-2 align-top text-right font-semibold tabular-nums text-maua-navy">
                    {isSection
                      ? formatCurrencyBRL(sectionSubtotals.get(row.key) ?? 0)
                      : row.total_price}
                  </td>
                  <td className="bg-[#F18213]/5 px-3 py-1.5 align-top">
                    <input
                      value={row.updated_qty}
                      onChange={(e) =>
                        updateRow(row.key, { updated_qty: e.target.value })
                      }
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="bg-[#F18213]/5 px-3 py-1.5 align-top">
                    <input
                      value={row.updated_value}
                      onChange={(e) =>
                        updateRow(row.key, { updated_value: e.target.value })
                      }
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="bg-[#F18213]/5 px-3 py-1.5 align-top">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end">
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
