"use server";

import { revalidatePath } from "next/cache";
import { saveOsAcceptanceTerm } from "@/lib/services/acceptance-terms";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getErrorMessage } from "@/lib/utils";

export type AcceptanceTermState = { error?: string; success?: boolean } | undefined;

export async function saveAcceptanceTermAction(
  projectId: string,
  codOs: string,
  _state: AcceptanceTermState,
  formData: FormData
): Promise<AcceptanceTermState> {
  const user = await getCurrentUser();
  if (user.role === "visualizador") {
    return { error: "Você não tem permissão para atualizar termos de aceite." };
  }

  const signedAt = String(formData.get("signed_at") ?? "").trim() || null;
  const document = formData.get("document");
  const documentFile =
    document instanceof File && document.size > 0 ? document : null;

  if (documentFile && documentFile.type !== "application/pdf") {
    return { error: "O termo de aceite deve ser um arquivo PDF." };
  }
  if (!signedAt && !documentFile) {
    return { error: "Informe a data de assinatura ou anexe o PDF." };
  }

  try {
    await saveOsAcceptanceTerm(projectId, codOs, {
      signedAt,
      documentFile,
      userId: user.id,
    });
  } catch (err) {
    return { error: getErrorMessage(err, "Erro ao salvar termo de aceite.") };
  }

  revalidatePath(`/termo-aceite/${projectId}`);
  return { success: true };
}
