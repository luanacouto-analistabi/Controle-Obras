import "server-only";

import { PDFParse } from "pdf-parse";

/**
 * Nível hierárquico de uma linha da "Lista de Preços" do Estaleiro:
 * 1 = seção (ex.: "A FACILIDADES")
 * 2 = item numerado (ex.: "1  601000  ENERGIA DE TERRA...")
 * 3 = sublinha do item (ex.: "- Conectar e desconectar cabos elétricos  Unid")
 * 4 = observação (ex.: "Observação: Conexão em hora extra...")
 */
export type FinalInvoiceRowLevel = 1 | 2 | 3 | 4;

export type ParsedFinalInvoiceRow = {
  level: FinalInvoiceRowLevel;
  item: string;
  os: string;
  description: string;
  qty: string;
  unit: string;
  unit_price: string;
  total_price: string;
};

const BOILERPLATE_PATTERNS: RegExp[] = [
  /^P-MAUA-/i,
  /^Data:/i,
  /^Cliente:/i,
  /^Embarcaç[aã]o:/i,
  /^LISTA DE PREÇOS$/i,
  /^ITEM\s+OS\s+DESCRIÇÃO\s+QTD\s+UNIT$/i,
  /^Preço unit\.?\s*Preço total$/i,
  /^R\$\s*R\$$/i,
  /^Página\s+\d+\s+de\s+\d+$/i,
  /^VALOR TOTAL ESTIMADO/i,
  /^--\s*\d+\s*of\s*\d+\s*--$/,
];

// "A FACILIDADES", "B SERVIÇOS" — uma letra maiúscula sozinha, espaço, e o
// resto da linha em caixa alta (sem minúsculas).
const SECTION_PATTERN = /^([A-ZÀ-Ý])\s+([A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 /().,-]*)$/;

// "1  601000  ENERGIA DE TERRA..." — número do item, OS de 6 dígitos
// (opcional, cai numa linha própria às vezes) e o resto da descrição.
const ITEM_PATTERN = /^(\d+)(?:\s+(\d{6}))?(?:\s+(.+))?$/;

const BULLET_PATTERN = /^[-•]\s*(.+)$/;
const LETTERED_SUBITEM_PATTERN = /^([A-Za-z])\)\s*(.+)$/;
const OBSERVATION_PATTERN = /^Observaç(ão|ões):?\s*(.*)$/i;

function isAllCaps(line: string): boolean {
  return /[A-ZÀ-Ý]/.test(line) && !/[a-zà-ÿ]/.test(line);
}

// Preposições/artigos curtos que não são unit — sem isso, uma sublinha que
// quebra em duas linhas físicas ("... para trabalho na\nembarcação HH")
// faria a última palavra da PRIMEIRA linha ("na") virar "unit" por engano.
const UNIT_STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "na", "no", "nas", "nos", "em", "um",
  "uma", "e", "o", "a", "as", "os", "que", "com", "para", "por", "ou", "se",
]);

/** Separa "<descrição> <qtd numérica> <unit>" do fim de uma linha, quando presente. */
function splitTrailingQtyUnit(text: string): {
  description: string;
  qty: string;
  unit: string;
} {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && /^\d+([.,]\d+)?$/.test(tokens[tokens.length - 2])) {
    const unit = tokens[tokens.length - 1];
    const qty = tokens[tokens.length - 2];
    return {
      description: tokens.slice(0, -2).join(" "),
      qty,
      unit,
    };
  }
  return { description: text, qty: "", unit: "" };
}

/**
 * Sublinhas ("- ...") desse modelo sempre terminam com a UNIT daquela
 * linha (é a coluna da direita "achatada" na extração de texto); às vezes
 * precedida da QTD, ou de um par tipo "Dia/ Unid" com espaço solto.
 */
function splitBulletUnit(text: string): {
  description: string;
  qty: string;
  unit: string;
} {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return { description: text, qty: "", unit: "" };

  const last = tokens[tokens.length - 1];
  const secondLast = tokens[tokens.length - 2];

  if (secondLast.endsWith("/")) {
    return {
      description: tokens.slice(0, -2).join(" "),
      qty: "",
      unit: `${secondLast}${last}`,
    };
  }
  if (/^\d+([.,]\d+)?$/.test(secondLast)) {
    return {
      description: tokens.slice(0, -2).join(" "),
      qty: secondLast,
      unit: last,
    };
  }
  if (UNIT_STOPWORDS.has(last.toLowerCase())) {
    return { description: text, qty: "", unit: "" };
  }
  return { description: tokens.slice(0, -1).join(" "), qty: "", unit: last };
}

function emptyRow(level: FinalInvoiceRowLevel): ParsedFinalInvoiceRow {
  return {
    level,
    item: "",
    os: "",
    description: "",
    qty: "",
    unit: "",
    unit_price: "",
    total_price: "",
  };
}

/**
 * Tabula o PDF de "Lista de Preços" do Estaleiro em linhas com hierarquia
 * (seção → item → sublinha → observação), respeitando o padrão de colunas
 * ITEM, OS, DESCRIÇÃO, QTD, UNIT, Preço unit. R$, Preço total R$ e
 * ignorando cabeçalho/rodapé repetidos em cada página.
 *
 * Extração por classificação de linha de texto (não pela grade de tabela
 * do PDF, que nesse modelo só tem borda externa + cabeçalho — detectar
 * "tabela" por linhas internas não funciona aqui). Heurística baseada no
 * modelo P-MAUA-501.4771-26; como toda extração de PDF, pode errar em
 * variações de layout — por isso a tabela resultante fica sempre editável
 * antes de salvar.
 */
export async function parseFinalInvoicePdf(
  bytes: Uint8Array
): Promise<ParsedFinalInvoiceRow[]> {
  const parser = new PDFParse({ data: bytes });
  let text: string;
  try {
    const textResult = await parser.getText();
    text = textResult.text;
  } finally {
    await parser.destroy();
  }

  const rows: ParsedFinalInvoiceRow[] = [];
  let lastRow: ParsedFinalInvoiceRow | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (BOILERPLATE_PATTERNS.some((pattern) => pattern.test(line))) continue;

    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch) {
      const row = emptyRow(1);
      row.item = sectionMatch[1];
      row.description = sectionMatch[2].trim();
      rows.push(row);
      lastRow = row;
      continue;
    }

    const observationMatch = OBSERVATION_PATTERN.exec(line);
    if (observationMatch) {
      const row = emptyRow(4);
      row.description = observationMatch[2].trim();
      rows.push(row);
      lastRow = row;
      continue;
    }

    const bulletMatch = BULLET_PATTERN.exec(line);
    if (bulletMatch) {
      const { description, qty, unit } = splitBulletUnit(bulletMatch[1].trim());
      const row = emptyRow(3);
      row.description = description;
      row.qty = qty;
      row.unit = unit;
      rows.push(row);
      lastRow = row;
      continue;
    }

    const letteredMatch = LETTERED_SUBITEM_PATTERN.exec(line);
    if (letteredMatch) {
      const { description, qty, unit } = splitBulletUnit(letteredMatch[2].trim());
      const row = emptyRow(3);
      row.item = letteredMatch[1];
      row.description = description;
      row.qty = qty;
      row.unit = unit;
      rows.push(row);
      lastRow = row;
      continue;
    }

    const itemMatch = ITEM_PATTERN.exec(line);
    if (itemMatch) {
      // Extrai QTD/UNIT só do que está NESSA linha (ex.: "... 1 serviço")
      // — nunca de linhas de continuação que vierem depois, senão uma
      // descrição comprida que termine em "número palavra" por acaso
      // (ex.: "...até 20 T.") vira QTD/UNIT errado.
      const { description, qty, unit } = splitTrailingQtyUnit(
        (itemMatch[3] ?? "").trim()
      );
      const row = emptyRow(2);
      row.item = itemMatch[1];
      row.os = itemMatch[2] ?? "";
      row.description = description;
      row.qty = qty;
      row.unit = unit;
      rows.push(row);
      lastRow = row;
      continue;
    }

    // Heading sem número (ex.: "EQUIPAMENTOS DE MOVIMENTAÇÃO DE CARGA",
    // "FORNECIMENTO DE MÃO DE OBRA") — agrupa visualmente como um item,
    // mas sem preço próprio.
    if (isAllCaps(line) && line.length > 3) {
      const row = emptyRow(2);
      row.description = line;
      rows.push(row);
      lastRow = row;
      continue;
    }

    // Linha solta (continuação de descrição/observação quebrada em duas
    // linhas pelo PDF) — gruda no que veio antes.
    if (lastRow) {
      lastRow.description = lastRow.description
        ? `${lastRow.description} ${line}`
        : line;
    }
  }

  return rows;
}
