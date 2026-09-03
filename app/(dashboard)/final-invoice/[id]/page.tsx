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

      <div>
        <h1 className="text-xl font-bold text-maua-navy">
          {project.vessel_name} · CC {project.cc}
        </h1>
        <p className="text-sm text-maua-gray-500">
          {project.client} · {project.project_coordinator}
          {lastChange && (
            <>
              {" · Última alteração por "}
              {lastChange.userName ?? "—"} em{" "}
              {formatDateTime(lastChange.changedAt)}
            </>
          )}
        </p>
      </div>

      <FinalInvoiceTabs projectId={project.id} dataByCategory={dataByCategory} />
    </div>
  );
}
