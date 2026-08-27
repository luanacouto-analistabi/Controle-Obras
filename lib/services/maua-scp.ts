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

let centrosCustoCache: { data: CentroCusto[]; expiresAt: number } | null = null;
const CENTROS_CUSTO_CACHE_MS = 5 * 60 * 1000;

/**
 * Centros de custo distintos da EAP para preencher o <select> de CC no
 * cadastro de projeto — só os que começam com "02" ou "07" (demais CCs da
 * carteira não são obras deste sistema).
 *
 * Cache em memória de 5 min: a EAP inteira tem ~8 mil linhas e ~5MB, pesado
 * demais pra buscar de novo a cada carregamento do formulário.
 */
export async function listCentrosCusto(): Promise<CentroCusto[]> {
  if (centrosCustoCache && centrosCustoCache.expiresAt > Date.now()) {
    return centrosCustoCache.data;
  }

  const records = await fetchEap();

  const byCc = new Map<string, string>();
  for (const record of records) {
    if (!/^(02|07)/.test(record.cod_ccusto)) continue;
    if (!byCc.has(record.cod_ccusto)) {
      byCc.set(record.cod_ccusto, record.descr_ccusto);
    }
  }

  const list = [...byCc.entries()]
    .map(([codCcusto, descrCcusto]) => ({ codCcusto, descrCcusto }))
    .sort((a, b) => a.codCcusto.localeCompare(b.codCcusto));

  centrosCustoCache = { data: list, expiresAt: Date.now() + CENTROS_CUSTO_CACHE_MS };
  return list;
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
