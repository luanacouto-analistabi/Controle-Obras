import { getCurrentUser } from "@/lib/supabase/dal";
import { logout } from "@/lib/actions/auth";

const ROLE_LABEL = {
  admin: "Administrador",
  gestor: "Gestor",
  visualizador: "Visualizador",
} as const;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-surface p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-6 shadow-card">
          <div>
            <h1 className="text-xl font-bold text-maua-navy">
              Olá, {user.fullName}
            </h1>
            <p className="text-sm text-maua-gray-500">
              {ROLE_LABEL[user.role]} · {user.email}
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

        <div className="rounded-xl border border-dashed border-border bg-white p-6 text-sm text-maua-gray-500 shadow-card">
          Dashboard consolidado de projetos — implementado na Fase 8, após o
          cadastro de projetos (Fase 3) existir.
        </div>
      </div>
    </main>
  );
}
