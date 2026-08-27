import Image from "next/image";
import { getCurrentUser } from "@/lib/supabase/dal";
import { logout } from "@/lib/actions/auth";
import { MainNav } from "@/components/layout/main-nav";

const ROLE_LABEL = {
  admin: "Administrador",
  gestor: "Gestor",
  visualizador: "Visualizador",
} as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-maua-navy px-4 py-5">
        <div className="flex flex-col items-center gap-3 border-b border-white/10 pb-5">
          <Image
            src="/estaleiro-maua-logo.png"
            alt="Estaleiro Mauá"
            width={160}
            height={67}
            priority
            className="h-12 w-auto"
          />
          <p className="text-center text-sm font-bold leading-tight text-white">
            Controle Financeiro de Projetos
          </p>
        </div>

        <div className="mt-5 flex-1">
          <MainNav />
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="text-xs text-[#94A3B8]">{ROLE_LABEL[user.role]}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="h-9 w-full rounded-lg border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
