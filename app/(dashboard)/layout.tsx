import Image from "next/image";
import { getCurrentUser } from "@/lib/supabase/dal";
import { logout } from "@/lib/actions/auth";

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
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
        <Image
          src="/estaleiro-maua-logo.png"
          alt="Estaleiro Mauá"
          width={140}
          height={58}
          priority
          className="h-9 w-auto"
        />
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-maua-navy">
              {user.fullName}
            </p>
            <p className="text-xs text-maua-gray-500">
              {ROLE_LABEL[user.role]}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="h-9 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-maua-navy transition-colors hover:bg-maua-gray-100"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
