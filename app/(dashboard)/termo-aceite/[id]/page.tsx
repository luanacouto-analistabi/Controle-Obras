import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectForEdit } from "@/lib/services/projects";
import { getCurrentUser } from "@/lib/supabase/dal";
import {
  listOsAcceptanceTerms,
  getAcceptanceTermSignedUrl,
} from "@/lib/services/acceptance-terms";
import { fetchEap } from "@/lib/services/maua-scp";
import { dedupeEapByOs } from "@/lib/utils";
import { OsAcceptanceRow } from "@/components/termo-aceite/os-acceptance-row";
import type { OsAcceptanceTerm } from "@/types/database.types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T00:00:00`));
}

export default async function TermoAceiteProjetoPage({
  params,
}: PageProps<"/termo-aceite/[id]">) {
  const { id } = await params;
  const [data, user] = await Promise.all([
    getProjectForEdit(id),
    getCurrentUser(),
  ]);

  if (!data) {
    notFound();
  }

  const { project } = data;
  const canEdit = user.role !== "visualizador";

  const [eapRows, existingTerms] = await Promise.all([
    fetchEap({ codCcusto: project.cc }).catch(() => []),
    listOsAcceptanceTerms(project.id).catch(
      () => ({}) as Record<string, OsAcceptanceTerm>
    ),
  ]);
  const osList = dedupeEapByOs(eapRows);

  const attachmentUrls: Record<string, string | null> = {};
  await Promise.all(
    Object.entries(existingTerms).map(async ([codOs, term]) => {
      attachmentUrls[codOs] = term.storage_path
        ? await getAcceptanceTermSignedUrl(term.storage_path)
        : null;
    })
  );

  return (
    <div className="mx-auto flex max-w-[1300px] flex-col gap-5">
      <Link
        href="/termo-aceite"
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar à lista de termos de aceite
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-maua-navy">
          Cadastro/Atualização Termo de Aceite
        </h1>
        <p className="text-base text-maua-gray-500">
          Uma OS por vez: informe a data de assinatura e/ou anexe o PDF.
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

      <section className="rounded-xl border border-border bg-white shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-maua-navy">
            OS do CC {project.cc}
          </h2>
        </div>

        {!canEdit ? (
          <div className="p-6 text-sm text-maua-gray-500">
            Seu perfil (Visualizador) não tem permissão para atualizar
            termos de aceite.
            <ul className="mt-3 list-disc pl-5">
              {osList
                .filter((os) => existingTerms[os.cod_os])
                .map((os) => (
                  <li key={os.cod_os}>
                    {os.cod_os} — {os.descr_os}: assinado em{" "}
                    {existingTerms[os.cod_os].signed_at
                      ? formatDate(existingTerms[os.cod_os].signed_at!)
                      : "—"}
                  </li>
                ))}
            </ul>
          </div>
        ) : osList.length === 0 ? (
          <p className="p-6 text-sm text-maua-gray-500">
            Nenhuma OS encontrada na EAP para este CC.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-[110px_1fr_100px_100px_150px_1fr] gap-3 border-b border-border bg-maua-gray-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
              <span>Cod. OS</span>
              <span>Descrição</span>
              <span>Data Início</span>
              <span>Data Fim</span>
              <span>Assinatura</span>
              <span>Anexo (PDF)</span>
            </div>
            <div className="max-h-[600px] divide-y divide-border overflow-y-auto">
              {osList.map((os) => (
                <OsAcceptanceRow
                  key={os.cod_os}
                  projectId={project.id}
                  os={os}
                  existing={existingTerms[os.cod_os] ?? null}
                  attachmentUrl={attachmentUrls[os.cod_os] ?? null}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
