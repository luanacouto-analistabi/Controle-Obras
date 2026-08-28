import Image from "next/image";
import { LogOut } from "lucide-react";
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
  const initial = user.fullName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-80 flex-shrink-0 flex-col gap-5 bg-maua-navy p-4">
        <div className="flex items-center justify-center rounded-xl bg-white p-3 shadow-card">
          <Image
            src="/estaleiro-maua-logo.png"
            alt="Estaleiro Mauá"
            width={160}
            height={67}
            priority
            className="h-11 w-auto"
          />
        </div>

        <div className="flex-1">
          <MainNav />
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F18213] text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="text-xs text-[#94A3B8]">{ROLE_LABEL[user.role]}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sair"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#C8D5DC] transition-colors hover:bg-[#2D3F4A] hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
