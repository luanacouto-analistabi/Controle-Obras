import "server-only";

import { PDFParse } from "pdf-parse";

export type ParsedFinalInvoiceRow = {
  item: string;
  os: string;
  description: string;
  qty: string;
  unit: string;
  unit_price: string;
  total_price: string;
};

/**
 * Tabula o PDF de "Lista de Preços" do Estaleiro (colunas ITEM, OS,
 * DESCRIÇÃO, QTD, UNIT, Preço unit. R$, Preço total R$) em linhas.
 *
 * Extração heurística — a lib detecta tabelas pela grade de linhas do PDF,
 * o que nem sempre bate 1:1 com a leitura humana (descrições multi-linha,
 * linhas de observação, cabeçalhos de seção como "A FACILIDADES"). Por
 * isso o resultado é sempre editável na tela antes de salvar: aqui é só um
 * rascunho tabulado, não a fonte de verdade.
 */
export async function parseFinalInvoicePdf(
  bytes: Uint8Array
): Promise<ParsedFinalInvoiceRow[]> {
  const parser = new PDFParse({ data: bytes });
  try {
    const tableResult = await parser.getTable();
    const tables =
      tableResult.mergedTables.length > 0
        ? tableResult.mergedTables
        : tableResult.pages.flatMap((page) => page.tables);

    const rows: ParsedFinalInvoiceRow[] = [];
    for (const table of tables) {
      for (const cells of table) {
        const trimmed = cells.map((c) => (c ?? "").trim());
        if (trimmed.every((c) => !c)) continue;
        rows.push(toRow(trimmed));
      }
    }
    if (rows.length > 0) return rows;

    // Fallback: nenhuma tabela detectada — devolve uma linha por linha de
    // texto, tudo em "description", pra não devolver a lista vazia.
    const textResult = await parser.getText();
    return textResult.text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !/^-- \d+ of \d+ --$/.test(line))
      .map((line) => toRow([line]));
  } finally {
    await parser.destroy();
  }
}

function toRow(cells: string[]): ParsedFinalInvoiceRow {
  if (cells.length >= 7) {
    const rest = [...cells];
    const item = rest.shift() ?? "";
    const os = rest.shift() ?? "";
    const total_price = rest.pop() ?? "";
    const unit_price = rest.pop() ?? "";
    const unit = rest.pop() ?? "";
    const qty = rest.pop() ?? "";
    return { item, os, description: rest.join(" ").trim(), qty, unit, unit_price, total_price };
  }
  const [item, ...rest] = cells;
  return {
    item: item ?? "",
    os: "",
    description: rest.join(" ").trim(),
    qty: "",
    unit: "",
    unit_price: "",
    total_price: "",
  };
}
