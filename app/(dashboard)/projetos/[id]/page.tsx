import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchEap } from "@/lib/services/maua-scp";
import { listOsAcceptanceTerms } from "@/lib/services/acceptance-terms";
import { PaymentEventsTable } from "@/components/projetos/payment-events-table";
import type { OsAcceptanceTerm } from "@/types/database.types";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: paymentEvents }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("payment_events")
      .select("*")
      .eq("project_id", id)
      .order("created_at"),
  ]);

  if (!project) {
    notFound();
  }

  const [eapRows, acceptanceTerms] = await Promise.all([
    fetchEap({ codCcusto: project.cc }).catch(() => []),
    listOsAcceptanceTerms(project.id).catch(
      () => ({}) as Record<string, OsAcceptanceTerm>
    ),
  ]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <Link
        href="/"
        className="w-fit text-sm font-semibold text-maua-navy hover:underline"
      >
        ← Voltar ao consolidado
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

      <p className="text-sm text-maua-gray-500">
        Clique num evento de pagamento para ver as OS da EAP concluídas até a
        Data Prevista de Pagamento.
      </p>

      <PaymentEventsTable
        paymentEvents={paymentEvents ?? []}
        eapRows={eapRows}
        acceptanceTerms={acceptanceTerms}
      />
    </div>
  );
}
