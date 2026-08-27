import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectForEdit } from "@/lib/services/projects";
import { getCurrentUser } from "@/lib/supabase/dal";
import { ProjectForm } from "@/components/configuracao/project-form";
import { formatCurrencyBRL } from "@/lib/utils";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function EditarProjetoPage({
  params,
}: PageProps<"/configuracao/[id]">) {
  const { id } = await params;
  const [data, user] = await Promise.all([
    getProjectForEdit(id),
    getCurrentUser(),
  ]);

  if (!data) {
    notFound();
  }

  const { project, paymentEvents, lastChange } = data;
  const canEdit = user.role !== "visualizador";

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/configuracao"
          className="w-fit text-sm font-semibold text-maua-navy hover:underline"
        >
          ← Voltar à configuração
        </Link>
        <Link
          href={`/configuracao/${project.id}/faturamento`}
          className="h-9 rounded-lg bg-[#F18213] px-4 text-sm font-bold text-white transition-colors hover:bg-[#D9730D] flex items-center"
        >
          Atualização Faturamento
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-maua-navy">
          {project.vessel_name} · CC {project.cc}
        </h1>
        <p className="text-sm text-maua-gray-500">
          {lastChange ? (
            <>
              Última alteração por {lastChange.userName ?? "—"} em{" "}
              {formatDateTime(lastChange.changedAt)}
            </>
          ) : (
            "Nenhuma alteração registrada ainda."
          )}
        </p>
      </div>

      {canEdit ? (
        <ProjectForm mode="edit" project={project} paymentEvents={paymentEvents} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white p-6 text-sm text-maua-gray-500 shadow-card">
          Seu perfil (Visualizador) não tem permissão para editar projetos.
          Os dados de pagamento e faturamento estão disponíveis na aba{" "}
          <Link href="/" className="text-maua-navy hover:underline">
            Consolidado
          </Link>
          .
          <ul className="mt-3 list-disc pl-5">
            {paymentEvents.map((event) => (
              <li key={event.id}>
                {event.payment_event} — {formatCurrencyBRL(event.amount)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
