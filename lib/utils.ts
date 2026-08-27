import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EapRecord } from "@/types/maua-scp.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor numérico como moeda brasileira (R$ 1.234,56). */
export function formatCurrencyBRL(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Extrai uma mensagem de erro legível. Erros do supabase-js (PostgrestError,
 * StorageError etc.) não são instâncias de `Error` — só `err instanceof
 * Error` perde a mensagem real e cai sempre no fallback genérico.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

/**
 * Deduplica linhas da EAP por cod_os, mantendo a de maior data_inicio —
 * a mesma OS pode aparecer mais de uma vez (fases/períodos diferentes).
 */
export function dedupeEapByOs(eapRows: EapRecord[]): EapRecord[] {
  const byOs = new Map<string, EapRecord>();
  for (const row of eapRows) {
    const existing = byOs.get(row.cod_os);
    if (!existing || (row.data_inicio ?? "") > (existing.data_inicio ?? "")) {
      byOs.set(row.cod_os, row);
    }
  }
  return [...byOs.values()].sort((a, b) => a.cod_os.localeCompare(b.cod_os));
}

/**
 * OS (EAP) concluídas até uma data de referência (a Data Prevista de
 * Pagamento de um evento de pagamento): data_fim <= referenceDate,
 * deduplicadas por cod_os (ver dedupeEapByOs).
 */
export function filterOsCompletedBy(
  eapRows: EapRecord[],
  referenceDate: string
): EapRecord[] {
  const eligible = eapRows.filter(
    (row) => row.data_fim !== null && row.data_fim <= referenceDate
  );
  return dedupeEapByOs(eligible);
}
