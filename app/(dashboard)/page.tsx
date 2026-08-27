import { listProjectsWithFinancialSummary } from "@/lib/services/projects";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ProjectsSummaryTable } from "@/components/dashboard/projects-summary-table";

export default async function DashboardPage() {
  const rows = await listProjectsWithFinancialSummary();

  const totals = rows.reduce(
    (acc, row) => {
      const s = row.summary;
      return {
        projectCount: acc.projectCount + 1,
        approved: acc.approved + (s?.approved_amount ?? 0),
        forecast: acc.forecast + (s?.forecast_amount ?? 0),
        paid: acc.paid + (s?.paid_amount ?? 0),
        upcoming: acc.upcoming + (s?.upcoming_amount ?? 0),
        overdue: acc.overdue + (s?.overdue_amount ?? 0),
        inDiscussion: acc.inDiscussion + (s?.in_discussion_amount ?? 0),
      };
    },
    {
      projectCount: 0,
      approved: 0,
      forecast: 0,
      paid: 0,
      upcoming: 0,
      overdue: 0,
      inDiscussion: 0,
    }
  );

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-maua-navy">
          Consolidado de Projetos
        </h1>
        <p className="text-sm text-maua-gray-500">
          Visão geral de todos os projetos e seus indicadores financeiros.
        </p>
      </div>

      <KpiCards totals={totals} />
      <ProjectsSummaryTable rows={rows} />
    </div>
  );
}
