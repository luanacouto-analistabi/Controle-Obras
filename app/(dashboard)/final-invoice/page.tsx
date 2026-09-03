import Link from "next/link";
import { listProjectsForConfig } from "@/lib/services/projects";
import { getCurrentUser } from "@/lib/supabase/dal";
import { DeleteProjectButton } from "@/components/final-invoice/delete-project-button";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function FinalInvoicePage() {
  const [rows, user] = await Promise.all([
    listProjectsForConfig(),
    getCurrentUser(),
  ]);
  const canEdit = user.role !== "visualizador";
  const canDelete = user.role === "admin";

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-maua-navy">Final Invoice</h1>
          <p className="text-base text-maua-gray-500">
            Projetos cadastrados com registros/configurações.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/final-invoice/novo"
            className="h-10 rounded-lg bg-[#F18213] px-4 text-base font-bold text-white transition-colors hover:bg-[#D9730D] flex items-center"
          >
            + Novo projeto
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
          <p className="text-base font-semibold text-maua-navy">
            Nenhum projeto cadastrado ainda
          </p>
          {canEdit && (
            <p className="mt-1 text-base text-maua-gray-500">
              Comece criando um projeto pelo botão acima.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[860px] border-collapse text-base">
            <thead>
              <tr>
                {[
                  "CC",
                  "Obra",
                  "Cliente",
                  "Coordenador",
                  "Última alteração",
                  ...(canDelete ? [""] : []),
                ].map((label) => (
                  <th
                    key={label}
                    className="border-b border-border bg-maua-navy px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-maua-gray-50">
                  <td className="border-b border-border px-3 py-2 text-maua-navy">
                    <Link
                      href={`/final-invoice/${row.id}`}
                      className="font-semibold text-maua-navy hover:underline"
                    >
                      {row.cc}
                    </Link>
                  </td>
                  <td className="border-b border-border px-3 py-2 text-maua-navy">
                    {row.vessel_name}
                  </td>
                  <td className="border-b border-border px-3 py-2">
                    {row.client}
                  </td>
                  <td className="border-b border-border px-3 py-2">
                    {row.project_coordinator}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-maua-gray-500">
                    {row.lastChange ? (
                      <>
                        {row.lastChange.userName ?? "—"} em{" "}
                        {formatDateTime(row.lastChange.changedAt)}
                      </>
                    ) : (
                      <span className="text-maua-gray-400">
                        Sem alterações
                      </span>
                    )}
                  </td>
                  {canDelete && (
                    <td className="border-b border-border px-3 py-2 text-right">
                      <DeleteProjectButton
                        projectId={row.id}
                        projectLabel={`${row.cc} - ${row.vessel_name}`}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
