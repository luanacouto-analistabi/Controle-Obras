import Link from "next/link";
import { listProjectsForConfig } from "@/lib/services/projects";

export default async function TermoAceitePage() {
  const rows = await listProjectsForConfig();

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-maua-navy">
          Atualização Termo de Aceite
        </h1>
        <p className="text-base text-maua-gray-500">
          Escolha um projeto para lançar a assinatura e o anexo do termo de
          aceite por OS.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
          <p className="text-base font-semibold text-maua-navy">
            Nenhum projeto cadastrado ainda
          </p>
          <p className="mt-1 text-base text-maua-gray-500">
            Cadastre um projeto em Configuração primeiro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[700px] border-collapse text-base">
            <thead>
              <tr>
                {["CC", "Coordenador", "Cliente", "Obra"].map((label) => (
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
                  <td className="border-b border-border px-3 py-2 font-mono text-sm">
                    <Link
                      href={`/termo-aceite/${row.id}`}
                      className="font-semibold text-maua-navy hover:underline"
                    >
                      {row.cc}
                    </Link>
                  </td>
                  <td className="border-b border-border px-3 py-2">
                    {row.project_coordinator}
                  </td>
                  <td className="border-b border-border px-3 py-2">
                    {row.client}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-maua-navy">
                    {row.vessel_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
