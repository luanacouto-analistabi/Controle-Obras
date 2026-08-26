import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
};

/**
 * Verifica a sessão via getClaims() (verificação local do JWT, sem round-trip
 * ao Auth server quando o projeto usa chaves assimétricas). Redireciona para
 * /login se não houver sessão válida — use isso, nunca leia cookies direto,
 * em Server Components, Server Actions e Route Handlers.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return {
    userId: data.claims.sub as string,
    email: (data.claims.email as string | undefined) ?? null,
  };
});

/** Ponto único de acesso ao usuário autenticado + papel (profiles.role). */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", session.userId)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  return {
    id: session.userId,
    email: session.email,
    fullName: profile.full_name,
    role: profile.role,
  };
});
