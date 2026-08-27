import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectForEdit } from "@/lib/services/projects";
import { getCurrentUser } from "@/lib/supabase/dal";
import { BillingForm } from "@/components/faturamento/billing-form";
import { formatCurrencyBRL } from "@/lib/utils";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T00:00:00`));
}

export default async function AtualizacaoFaturamentoPage({
  params,
}: PageProps<"/configuracao/[id]/faturamento">) {
  const { id } = await params;
  const [data, user] = await Promise.all([
    getProjectForEdit(id),
    getCurrentUser(),
  ]);

  if (!data) {
    notFound();
  }

  const { project, paymentEvents, billingEvents } = data;
  const canEdit = user.role !== "visualizador";

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
      <Link
        href={`/configuracao/${project.id}`}
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar ao projeto
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-maua-navy">
          Atualização Faturamento
        </h1>
        <p className="text-base text-maua-gray-500">
          Lance ou ajuste o faturamento — não exige novo cronograma.
        </p>
      </div>

      {/* Bloco 1 — somente leitura, contexto do projeto */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-maua-navy">
          1. Informações Gerais
        </h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-maua-gray-500">CC</dt>
            <dd className="font-mono font-semibold text-maua-navy">
              {project.cc}
            </dd>
          </div>
          <div>
            <dt className="text-maua-gray-500">Coordenador de Projeto</dt>
            <dd className="font-semibold text-maua-navy">
              {project.project_coordinator}
            </dd>
          </div>
          <div>
            <dt className="text-maua-gray-500">Cliente</dt>
            <dd className="font-semibold text-maua-navy">{project.client}</dd>
          </div>
          <div>
            <dt className="text-maua-gray-500">Nome da Embarcação</dt>
            <dd className="font-semibold text-maua-navy">
              {project.vessel_name}
            </dd>
          </div>
          <div>
            <dt className="text-maua-gray-500">Data Início</dt>
            <dd className="font-semibold text-maua-navy">
              {formatDate(project.start_date)}
            </dd>
          </div>
          <div>
            <dt className="text-maua-gray-500">Data Fim</dt>
            <dd className="font-semibold text-maua-navy">
              {formatDate(project.end_date)}
            </dd>
          </div>
        </dl>
      </section>

      {canEdit ? (
        <BillingForm
          projectId={project.id}
          paymentEvents={paymentEvents}
          billingEvents={billingEvents}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white p-6 text-sm text-maua-gray-500 shadow-card">
          Seu perfil (Visualizador) não tem permissão para atualizar
          faturamento.
          <ul className="mt-3 list-disc pl-5">
            {billingEvents.map((event) => (
              <li key={event.id}>
                {formatDate(event.billing_date)} — Faturado:{" "}
                {formatCurrencyBRL(event.billed_amount)} · Vencido:{" "}
                {formatCurrencyBRL(event.overdue_amount)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
