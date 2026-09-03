import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectWithLastChange } from "@/lib/services/projects";
import { getFinalInvoiceDataByProject } from "@/lib/services/final-invoice";
import { FinalInvoiceTabs } from "@/components/final-invoice/final-invoice-tabs";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-maua-navy/60">
        {label}
      </span>
      <span className="text-sm font-semibold text-maua-navy">{value}</span>
    </div>
  );
}

export default async function FinalInvoiceProjectPage({
  params,
}: PageProps<"/final-invoice/[id]">) {
  const { id } = await params;
  const data = await getProjectWithLastChange(id);

  if (!data) {
    notFound();
  }

  const { project, lastChange } = data;
  const dataByCategory = await getFinalInvoiceDataByProject(id);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <Link
        href="/final-invoice"
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar ao Final Invoice
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
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-white p-6 shadow-card sm:grid-cols-4">
        <InfoField label="Centro de Custo" value={project.cc} />
        <InfoField label="Obra" value={project.vessel_name} />
        <InfoField label="Cliente" value={project.client} />
        <InfoField label="Coordenador" value={project.project_coordinator} />
        <InfoField
          label="Última Alteração"
          value={
            lastChange
              ? `${lastChange.userName ?? "—"} em ${formatDateTime(lastChange.changedAt)}`
              : "Sem alterações"
          }
        />
      </div>

      <FinalInvoiceTabs projectId={project.id} dataByCategory={dataByCategory} />
    </div>
  );
}
