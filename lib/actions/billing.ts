"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BillingFormSchema } from "@/lib/validators/project";
import { updateBillingEvents } from "@/lib/services/project-mutations";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getErrorMessage } from "@/lib/utils";

export type BillingFormState = { error?: string } | undefined;

export async function updateBillingEventsAction(
  projectId: string,
  _state: BillingFormState,
  formData: FormData
): Promise<BillingFormState> {
  const user = await getCurrentUser();
  if (user.role === "visualizador") {
    return { error: "Você não tem permissão para atualizar o faturamento." };
  }

  let billingEvents: unknown = [];
  try {
    billingEvents = JSON.parse(String(formData.get("billingEvents") ?? "[]"));
  } catch {
    // deixa o zod rejeitar o formato inválido abaixo
  }

  const parsed = BillingFormSchema.safeParse({ billingEvents });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateBillingEvents(projectId, parsed.data.billingEvents, user.id);
  } catch (err) {
    return { error: getErrorMessage(err, "Erro ao salvar faturamento.") };
  }

  revalidatePath(`/configuracao/${projectId}`);
  revalidatePath("/configuracao");
  revalidatePath("/");
  redirect(`/configuracao/${projectId}`);
}
