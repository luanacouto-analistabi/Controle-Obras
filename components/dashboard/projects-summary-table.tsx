import Link from "next/link";
import { formatCurrencyBRL } from "@/lib/utils";
import type { ProjectSummaryRow } from "@/lib/services/projects";

const ZERO = {
  approved_amount: 0,
  in_discussion_amount: 0,
  forecast_amount: 0,
  po_not_issued_amount: 0,
  po_no_balance_amount: 0,
  paid_amount: 0,
  upcoming_amount: 0,
  overdue_amount: 0,
};

function Money({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-maua-gray-400">–</span>;
  }
  return <span className="tabular-nums">{formatCurrencyBRL(value)}</span>;
}

export function ProjectsSummaryTable({ rows }: { rows: ProjectSummaryRow[] }) {
  const totals = rows.reduce(
    (acc, row) => {
      const s = row.summary ?? ZERO;
      return {
        approved_amount: acc.approved_amount + s.approved_amount,
        in_discussion_amount: acc.in_discussion_amount + s.in_discussion_amount,
        forecast_amount: acc.forecast_amount + s.forecast_amount,
        po_not_issued_amount: acc.po_not_issued_amount + s.po_not_issued_amount,
        po_no_balance_amount: acc.po_no_balance_amount + s.po_no_balance_amount,
        paid_amount: acc.paid_amount + s.paid_amount,
        upcoming_amount: acc.upcoming_amount + s.upcoming_amount,
        overdue_amount: acc.overdue_amount + s.overdue_amount,
      };
    },
    { ...ZERO }
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-maua-navy">
          Nenhum projeto cadastrado ainda
        </p>
        <p className="mt-1 text-sm text-maua-gray-500">
          O cadastro de projetos (upload de cronograma + formulário) entra na
          próxima etapa.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border-b border-border bg-maua-navy/20 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
            >
              CC
            </th>
            <th
              rowSpan={2}
              className="border-b border-border bg-maua-navy/20 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
            >
              Cliente
            </th>
            <th
              rowSpan={2}
              className="border-b border-border bg-maua-navy/20 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
            >
              Obra
            </th>
            <th
              colSpan={3}
              className="border-b border-l border-border bg-maua-navy/20 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
            >
              Medição
            </th>
            <th
              colSpan={2}
              className="border-b border-l border-border bg-maua-navy/20 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
            >
              Emissão PO
            </th>
            <th
              colSpan={3}
              className="border-b border-l border-border bg-maua-navy/20 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-maua-navy/70"
            >
              Aprovada
            </th>
          </tr>
          <tr>
            <th className="border-b border-l border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              Aprovada
            </th>
            <th className="border-b border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              Em discussão
            </th>
            <th className="border-b border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              Prevista
            </th>
            <th className="border-b border-l border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              PO não emitida
            </th>
            <th className="border-b border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              PO sem saldo
            </th>
            <th className="border-b border-l border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              Pago
            </th>
            <th className="border-b border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              A vencer
            </th>
            <th className="border-b border-border bg-maua-navy/10 px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              Vencido
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const s = row.summary ?? ZERO;
            return (
              <tr key={row.id} className="hover:bg-maua-gray-50">
                <td className="border-b border-border px-3 py-2 font-mono text-xs">
                  <Link
                    href={`/projetos/${row.id}`}
                    className="font-semibold text-maua-navy hover:underline"
                  >
                    {row.cc}
                  </Link>
                </td>
                <td className="border-b border-border px-3 py-2 text-maua-gray-900">
                  {row.client}
                </td>
                <td className="border-b border-border px-3 py-2 text-maua-navy">
                  {row.vessel_name}
                </td>
                <td className="border-b border-l border-border px-3 py-2 text-right">
                  <Money value={s.approved_amount} />
                </td>
                <td className="border-b border-border px-3 py-2 text-right">
                  <Money value={s.in_discussion_amount} />
                </td>
                <td className="border-b border-border px-3 py-2 text-right">
                  <Money value={s.forecast_amount} />
                </td>
                <td className="border-b border-l border-border px-3 py-2 text-right">
                  <Money value={s.po_not_issued_amount} />
                </td>
                <td className="border-b border-border px-3 py-2 text-right">
                  <Money value={s.po_no_balance_amount} />
                </td>
                <td className="border-b border-l border-border px-3 py-2 text-right">
                  <Money value={s.paid_amount} />
                </td>
                <td className="border-b border-border px-3 py-2 text-right">
                  <Money value={s.upcoming_amount} />
                </td>
                <td className="border-b border-border px-3 py-2 text-right">
                  <Money value={s.overdue_amount} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-maua-gray-100 font-bold">
            <td colSpan={3} className="px-3 py-2 text-maua-navy">
              Total
            </td>
            <td className="border-l border-border px-3 py-2 text-right">
              <Money value={totals.approved_amount} />
            </td>
            <td className="px-3 py-2 text-right">
              <Money value={totals.in_discussion_amount} />
            </td>
            <td className="px-3 py-2 text-right">
              <Money value={totals.forecast_amount} />
            </td>
            <td className="border-l border-border px-3 py-2 text-right">
              <Money value={totals.po_not_issued_amount} />
            </td>
            <td className="px-3 py-2 text-right">
              <Money value={totals.po_no_balance_amount} />
            </td>
            <td className="border-l border-border px-3 py-2 text-right">
              <Money value={totals.paid_amount} />
            </td>
            <td className="px-3 py-2 text-right">
              <Money value={totals.upcoming_amount} />
            </td>
            <td className="px-3 py-2 text-right">
              <Money value={totals.overdue_amount} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
