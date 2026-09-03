import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectForEdit } from "@/lib/services/projects";
import { getFinalInvoiceDataByProject } from "@/lib/services/final-invoice";
import { ProjectForm } from "@/components/configuracao/project-form";
import { listCentrosCusto, listVesselNamesByCc } from "@/lib/services/maua-scp";

export default async function EditarFinalInvoiceProjectPage({
  params,
}: PageProps<"/final-invoice/[id]/editar">) {
  const { id } = await params;
  const [data, centrosCusto, vesselNamesByCc] = await Promise.all([
    getProjectForEdit(id),
    listCentrosCusto().catch(() => []),
    listVesselNamesByCc().catch(() => ({})),
  ]);

  if (!data) {
    notFound();
  }

  const { project, paymentEvents } = data;
  const finalInvoiceData = await getFinalInvoiceDataByProject(id);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <Link
        href={`/final-invoice/${id}`}
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar ao projeto
      </Link>
      <div>
        <h1 className="text-xl font-bold text-maua-navy">
          Editar projeto — Final Invoice
        </h1>
        <p className="text-sm text-maua-gray-500">
          {project.vessel_name} · CC {project.cc}
        </p>
      </div>
      <ProjectForm
        mode="edit"
        variant="final-invoice"
        project={project}
        paymentEvents={paymentEvents}
        finalInvoiceData={finalInvoiceData}
        centrosCusto={centrosCusto}
        vesselNamesByCc={vesselNamesByCc}
      />
    </div>
  );
}
