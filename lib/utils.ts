import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
