import Link from "next/link";
import { ProjectForm } from "@/components/configuracao/project-form";
import { listCentrosCusto, listVesselNamesByCc } from "@/lib/services/maua-scp";

export default async function NovoFinalInvoicePage() {
  const [centrosCusto, vesselNamesByCc] = await Promise.all([
    listCentrosCusto().catch(() => []),
    listVesselNamesByCc().catch(() => ({})),
  ]);

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
          Novo projeto — Final Invoice
        </h1>
        <p className="text-sm text-maua-gray-500">
          Preencha as informações gerais do projeto para criar a Final
          Invoice.
        </p>
      </div>
      <ProjectForm
        mode="create"
        variant="final-invoice"
        centrosCusto={centrosCusto}
        vesselNamesByCc={vesselNamesByCc}
      />
    </div>
  );
}
