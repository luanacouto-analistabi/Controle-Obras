import "server-only";

import type { EapRecord, TimesheetRecord } from "@/types/maua-scp.types";

/**
 * Cliente para as APIs internas do SCP Mauá (Timesheet, EAP). Consumidas ao
 * vivo a cada chamada — nada disso é persistido no Supabase (decisão do
 * time: os dados mudam com frequência e já existem no SCP).
 */

async function fetchMauaScp<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const baseUrl = process.env.MAUA_SCP_API_BASE_URL;
  const token = process.env.MAUA_SCP_API_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "MAUA_SCP_API_BASE_URL / MAUA_SCP_API_TOKEN não configurados (ver .env.example)."
    );
  }

  const url = new URL(`${baseUrl}/${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  // cache:"no-store" — a resposta da EAP (~5MB) excede o limite de 2MB do
  // Next Data Cache, então o cache dele nunca ajudaria aqui de qualquer
  // forma. listCentrosCusto() abaixo tem seu próprio cache em memória.
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // A API responde com BOM UTF-8 — quebra JSON.parse se não for removido.
  const raw = (await response.text()).replace(/^﻿/, "");

  if (!response.ok) {
    throw new Error(`Maua SCP API (${path}) retornou ${response.status}: ${raw}`);
  }

  return JSON.parse(raw) as T;
}

/** EAP (estrutura analítica de projeto) — carteira inteira ou filtrada por CC. */
export async function fetchEap(filters?: {
  codCcusto?: string;
}): Promise<EapRecord[]> {
  return fetchMauaScp<EapRecord[]>(
    "Maua_Eap.php",
    filters?.codCcusto ? { codccusto: filters.codCcusto } : undefined
  );
}

export type CentroCusto = { codCcusto: string; descrCcusto: string };

type FilteredEapRow = { codCcusto: string; descrCcusto: string };

let filteredEapCache: { data: FilteredEapRow[]; expiresAt: number } | null = null;
const FILTERED_EAP_CACHE_MS = 5 * 60 * 1000;

/**
 * EAP filtrada aos CCs que começam com "02" ou "07" (demais CCs da carteira
 * não são obras deste sistema) — base para listCentrosCusto() e
 * listVesselNamesByCc().
 *
 * Cache em memória de 5 min: a EAP inteira tem ~8 mil linhas e ~5MB, pesado
 * demais pra buscar de novo a cada carregamento do formulário (e grande
 * demais pro Data Cache do Next, que rejeita respostas acima de 2MB).
 */
async function getFilteredEapRows(): Promise<FilteredEapRow[]> {
  if (filteredEapCache && filteredEapCache.expiresAt > Date.now()) {
    return filteredEapCache.data;
  }

  const records = await fetchEap();
  const filtered = records
    .filter((r) => /^(02|07)/.test(r.cod_ccusto))
    .map((r) => ({
      codCcusto: r.cod_ccusto,
      descrCcusto: r.descr_ccusto,
    }));

  filteredEapCache = { data: filtered, expiresAt: Date.now() + FILTERED_EAP_CACHE_MS };
  return filtered;
}

/** Centros de custo distintos da EAP para preencher o <select> de CC. */
export async function listCentrosCusto(): Promise<CentroCusto[]> {
  const rows = await getFilteredEapRows();

  const byCc = new Map<string, string>();
  for (const row of rows) {
    if (!byCc.has(row.codCcusto)) {
      byCc.set(row.codCcusto, row.descrCcusto);
    }
  }

  return [...byCc.entries()]
    .map(([codCcusto, descrCcusto]) => ({ codCcusto, descrCcusto }))
    .sort((a, b) => a.codCcusto.localeCompare(b.codCcusto));
}

/**
 * `descr_ccusto` (nome da embarcação/obra) distintos da EAP, agrupados por
 * `cod_ccusto` — alimenta a checklist de "Nome da Embarcação", que só
 * mostra as opções do CC selecionado. Normalmente é um único valor por CC;
 * a lista existe para o caso raro de variação de grafia entre linhas.
 */
export async function listVesselNamesByCc(): Promise<Record<string, string[]>> {
  const rows = await getFilteredEapRows();

  const byCc: Record<string, Set<string>> = {};
  for (const row of rows) {
    if (!row.descrCcusto) continue;
    (byCc[row.codCcusto] ??= new Set()).add(row.descrCcusto);
  }

  const result: Record<string, string[]> = {};
  for (const [cc, names] of Object.entries(byCc)) {
    result[cc] = [...names].sort();
  }
  return result;
}

/** Apontamentos de timesheet num intervalo de datas (YYYY-MM-DD). */
export async function fetchTimesheet(params: {
  dataInicial: string;
  dataFinal: string;
}): Promise<TimesheetRecord[]> {
  return fetchMauaScp<TimesheetRecord[]>("Maua_Timesheet.php", {
    data_inicial: params.dataInicial,
    data_final: params.dataFinal,
  });
}

/**
 * Normaliza um Centro de Custo para comparação entre fontes que usam
 * formatos diferentes: EAP retorna `cod_ccusto` como string com zeros à
 * esquerda (`"020172"`), Timesheet retorna `CODCCUSTO` como número sem
 * padding (`20233`). Remove zeros à esquerda para comparar como texto.
 */
export function normalizeCc(cc: string | number): string {
  return String(cc).replace(/^0+/, "");
}
