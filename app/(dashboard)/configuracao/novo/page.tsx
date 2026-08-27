import Link from "next/link";
import { ProjectForm } from "@/components/configuracao/project-form";
import { listCentrosCusto, listVesselNamesByCc } from "@/lib/services/maua-scp";

export default async function NovoProjetoPage() {
  const [centrosCusto, vesselNamesByCc] = await Promise.all([
    listCentrosCusto().catch(() => []),
    listVesselNamesByCc().catch(() => ({})),
  ]);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <Link
        href="/configuracao"
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar à configuração
      </Link>
      <div>
        <h1 className="text-xl font-bold text-maua-navy">Novo projeto</h1>
        <p className="text-sm text-maua-gray-500">
          Preencha os três blocos abaixo para cadastrar o projeto.
        </p>
      </div>
      <ProjectForm
        mode="create"
        centrosCusto={centrosCusto}
        vesselNamesByCc={vesselNamesByCc}
      />
    </div>
  );
}
