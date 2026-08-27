/**
 * Formatos observados em chamadas reais às APIs (26/08/2026) — não há
 * contrato OpenAPI publicado, então isto é a fonte da verdade até alguma
 * mudança de layout do lado do SCP.
 */

export type EapRecord = {
  id_eap: number;
  cod_ccusto: string;
  descr_ccusto: string;
  cod_os: string;
  descr_os: string;
  cod_atividade: string;
  descr_atividade: string;
  unidade: string | null;
  quantidade: number | null;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  data_cadastro: string;
  status: string;
  progresso: number;
  project_id: string;
  unique_id: string;
  wbs: string;
};

export type TimesheetRecord = {
  IDAPONTAMENTO: number;
  DATA: string;
  CHAPA: number;
  CODATIVIDADE: number;
  ATIVIDADE: string;
  HN: number;
  H50: number;
  H100: number;
  CODCCUSTO: number;
  TURNO: number;
  CODOS: number;
  OS: string;
  GRUPO: string;
  USUARIO: string;
  NOME: string;
  FUNCAO: string;
  CODSECAO: number;
  SECAO: string;
  CENTROCUSTO: string;
  CODOBRA: string;
  NOMEOBRA: string;
  CODRECEBIMENTO: string;
  MO: string;
  DATAALTERACAO: string;
  JOBCARD: string;
  QUANTIDADE: number;
  CQ: number;
  AVALIACAO: number;
};
