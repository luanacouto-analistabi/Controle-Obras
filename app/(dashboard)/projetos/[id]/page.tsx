import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrencyBRL } from "@/lib/utils";

/**
 * MOCK — linhas hardcoded só para validar o layout pedido (print
 * "Captura de tela 2026-08-27 101110.png"). Ainda não vem do Supabase:
 * os campos "Medição"/"Faturado" (status em texto) e "Data de
 * Faturamento" por evento não existem no schema atual (payment_events
 * tem measurement_date como data, não status; billing_date vive em
 * billing_events, não por linha de pagamento) — a decidir antes de
 * migrar isso para dado real.
 */
const MOCK_PAYMENT_ROWS = [
  {
    evento: "Parcela Contratual",
    descricaoInvoice: "1ª Parcela",
    dataInvoice: "15/03/2026",
    condicaoDias: "10 dias",
    dataPrevistaPagamento: "25/03/2026",
    contrato: 120000,
    medicao: "Aprovada",
    emissaoPo: "–",
    invoice: "101/2026",
    dataFaturamento: "20/03/2026",
    faturado: "Pago",
  },
  {
    evento: "VOR 50%",
    descricaoInvoice: "VOR 05 - 50%",
    dataInvoice: "10/04/2026",
    condicaoDias: "15 dias",
    dataPrevistaPagamento: "25/04/2026",
    contrato: 45000,
    medicao: "Aprovada",
    emissaoPo: "–",
    invoice: "102/2026",
    dataFaturamento: "–",
    faturado: "A faturar",
  },
  {
    evento: "Medição Mensal",
    descricaoInvoice: "Medição Abril",
    dataInvoice: "–",
    condicaoDias: "10 dias",
    dataPrevistaPagamento: "10/05/2026",
    contrato: 80000,
    medicao: "Em análise",
    emissaoPo: "Sim",
    invoice: "–",
    dataFaturamento: "–",
    faturado: "Pendente",
  },
  {
    evento: "Parcela Final",
    descricaoInvoice: "Entrega",
    dataInvoice: "–",
    condicaoDias: "30 dias",
    dataPrevistaPagamento: "30/06/2026",
    contrato: 200000,
    medicao: "Pendente",
    emissaoPo: "Não",
    invoice: "–",
    dataFaturamento: "–",
    faturado: "Pendente",
  },
];

const FATURADO_BADGE: Record<string, string> = {
  Pago: "bg-[#9AD595] text-[#1B5E37]",
  "A faturar": "bg-[#F9E79F] text-[#7B5800]",
  Pendente: "bg-maua-gray-100 text-maua-gray-500",
};

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const total = MOCK_PAYMENT_ROWS.reduce((sum, row) => sum + row.contrato, 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <Link
        href="/"
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar ao consolidado
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-maua-navy px-6 py-4 text-white shadow-card">
        <div>
          <p className="text-lg font-bold uppercase tracking-wide">
            {project.vessel_name}
          </p>
          <p className="text-sm text-white/70">
            CC {project.cc} · {project.client}
          </p>
        </div>
        <span className="rounded-full bg-[#F18213] px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
          Real Contratado
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-[#F18213]/50 bg-[#F18213]/10 px-4 py-2 text-xs font-semibold text-[#7B5800]">
        Dados de exemplo — pagamentos deste projeto ainda não vêm do banco
        (ver nota no código sobre os campos Medição/Faturado).
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr>
              {[
                "Eventos",
                "Descrição na Invoice",
                "Data Invoice",
                "Condição (dias)",
                "Data Prevista Pagamento",
                "Contrato",
                "Medição",
                "Emissão PO",
                "Invoice",
              ].map((label) => (
                <th
                  key={label}
                  className="border-b border-border bg-maua-navy/20 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
                >
                  {label}
                </th>
              ))}
              <th className="border-b border-l border-border bg-[#9AD595]/30 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#1B5E37]">
                Data de Faturamento
              </th>
              <th className="border-b border-border bg-[#9AD595]/30 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#1B5E37]">
                Faturado
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENT_ROWS.map((row, index) => (
              <tr key={index} className="hover:bg-maua-gray-50">
                <td className="border-b border-border px-3 py-2 text-maua-navy">
                  {row.evento}
                </td>
                <td className="border-b border-border px-3 py-2">
                  {row.descricaoInvoice}
                </td>
                <td className="border-b border-border px-3 py-2 tabular-nums">
                  {row.dataInvoice}
                </td>
                <td className="border-b border-border px-3 py-2 text-center">
                  {row.condicaoDias}
                </td>
                <td className="border-b border-border px-3 py-2 tabular-nums">
                  {row.dataPrevistaPagamento}
                </td>
                <td className="border-b border-border px-3 py-2 text-right font-semibold tabular-nums">
                  {formatCurrencyBRL(row.contrato)}
                </td>
                <td className="border-b border-border px-3 py-2">
                  {row.medicao}
                </td>
                <td className="border-b border-border px-3 py-2 text-center">
                  {row.emissaoPo}
                </td>
                <td className="border-b border-border px-3 py-2">
                  {row.invoice}
                </td>
                <td className="border-b border-l border-border bg-[#9AD595]/10 px-3 py-2 tabular-nums">
                  {row.dataFaturamento}
                </td>
                <td className="border-b border-border bg-[#9AD595]/10 px-3 py-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${FATURADO_BADGE[row.faturado]}`}
                  >
                    {row.faturado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-maua-gray-100 font-bold">
              <td colSpan={5} className="px-3 py-2 text-maua-navy">
                Total
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrencyBRL(total)}
              </td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
