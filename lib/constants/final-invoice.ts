export const FINAL_INVOICE_CATEGORIES = [
  "PPU",
  "Tubulação",
  "Timesheets",
  "Válvulas",
  "Água Doce",
  "Andaimes",
  "Armazenagem",
  "Caixa Distribuição",
  "Energia",
  "Guindaste",
  "Resíduo",
  "Sewage",
] as const;

export type FinalInvoiceCategory = (typeof FINAL_INVOICE_CATEGORIES)[number];

export function isFinalInvoiceCategory(
  value: string
): value is FinalInvoiceCategory {
  return (FINAL_INVOICE_CATEGORIES as readonly string[]).includes(value);
}
