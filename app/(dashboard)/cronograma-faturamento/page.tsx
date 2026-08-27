import Link from "next/link";
import {
  getBillingSchedule,
  formatMonthLabel,
} from "@/lib/services/billing-schedule";
import { formatCurrencyBRL } from "@/lib/utils";

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default async function CronogramaFaturamentoPage({
  searchParams,
}: PageProps<"/cronograma-faturamento">) {
  const params = await searchParams;
  const defaults = currentYearMonth();
  const year = Number(params.ano) || defaults.year;
  const month = Number(params.mes) || defaults.month;

  const { buckets, rows } = await getBillingSchedule(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const bucketTotals = buckets.map((_, i) =>
    rows.reduce((sum, r) => sum + r.weekAmounts[i], 0)
  );

  const navButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-maua-navy hover:bg-maua-gray-100";

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-maua-navy">
            Cronograma de Previsão de Faturamento dos Projetos
          </h1>
          <p className="text-base text-maua-gray-500">
            Soma da Data Prevista de Pagamento dos eventos de pagamento,
            semana a semana.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/cronograma-faturamento?ano=${prevYear}&mes=${prevMonth}`}
            className={navButtonClass}
            aria-label="Mês anterior"
          >
            ←
          </Link>
          <span className="w-28 text-center text-lg font-bold text-maua-navy">
            {formatMonthLabel(year, month)}
          </span>
          <Link
            href={`/cronograma-faturamento?ano=${nextYear}&mes=${nextMonth}`}
            className={navButtonClass}
            aria-label="Próximo mês"
          >
            →
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
          <p className="text-base font-semibold text-maua-navy">
            Nenhum faturamento previsto para {formatMonthLabel(year, month)}
          </p>
          <p className="mt-1 text-base text-maua-gray-500">
            Nenhum evento de pagamento com Data Prevista de Pagamento neste
            mês.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-border bg-maua-navy px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                  Centro de Custo
                </th>
                <th className="border-b border-border bg-maua-navy px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                  Projeto
                </th>
                {buckets.map((bucket) => (
                  <th
                    key={bucket.label}
                    className="border-b border-l border-border bg-maua-navy px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-white"
                  >
                    {bucket.label}
                  </th>
                ))}
                <th className="border-b border-l border-border bg-[#9AD595]/60 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#1B5E37]">
                  Total a ser Faturado {formatMonthLabel(year, month)}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="hover:bg-maua-gray-50">
                  <td className="border-b border-border px-3 py-2 font-mono text-xs">
                    {row.cc} - {row.category}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-maua-navy">
                    {row.vesselName}
                  </td>
                  {row.weekAmounts.map((amount, i) => (
                    <td
                      key={buckets[i].label}
                      className="border-b border-l border-border px-3 py-2 text-right tabular-nums"
                    >
                      {amount === 0 ? (
                        <span className="text-maua-gray-400">–</span>
                      ) : (
                        formatCurrencyBRL(amount)
                      )}
                    </td>
                  ))}
                  <td className="border-b border-l border-border bg-[#9AD595]/10 px-3 py-2 text-right font-semibold tabular-nums">
                    {formatCurrencyBRL(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-maua-gray-100 font-bold">
                <td colSpan={2} className="px-3 py-2 text-maua-navy">
                  Total
                </td>
                {bucketTotals.map((amount, i) => (
                  <td
                    key={buckets[i].label}
                    className="border-l border-border px-3 py-2 text-right tabular-nums"
                  >
                    {amount === 0 ? "–" : formatCurrencyBRL(amount)}
                  </td>
                ))}
                <td className="border-l border-border bg-[#9AD595]/20 px-3 py-2 text-right tabular-nums">
                  {formatCurrencyBRL(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
