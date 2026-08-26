import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — Controle de Obras",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-8 shadow-card">
        <h1 className="mb-1 text-xl font-bold text-maua-navy">
          Controle de Obras
        </h1>
        <p className="mb-6 text-sm text-maua-gray-500">
          Entre com sua conta para acessar os projetos.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
