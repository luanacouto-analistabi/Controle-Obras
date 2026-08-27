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
