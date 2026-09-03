"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getErrorMessage } from "@/lib/utils";
import { isFinalInvoiceCategory } from "@/lib/constants/final-invoice";
import {
  replaceFinalInvoiceDocument,
  replaceFinalInvoiceItems,
} from "@/lib/services/final-invoice-mutations";
import { FinalInvoiceItemsFormSchema } from "@/lib/validators/final-invoice";

export type FinalInvoiceActionState =
  | { error?: string; success?: boolean }
  | undefined;

export async function uploadFinalInvoiceDocumentAction(
  projectId: string,
  category: string,
  _state: FinalInvoiceActionState,
  formData: FormData
): Promise<FinalInvoiceActionState> {
  const user = await getCurrentUser();
  if (user.role === "visualizador") {
    return { error: "Você não tem permissão para enviar documentos." };
  }
  if (!isFinalInvoiceCategory(category)) {
    return { error: "Categoria inválida." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo PDF." };
  }
  if (file.type !== "application/pdf") {
    return { error: "O arquivo deve ser um PDF." };
  }

  try {
    await replaceFinalInvoiceDocument(projectId, category, file, user.id);
  } catch (err) {
    return { error: getErrorMessage(err, "Erro ao processar o PDF.") };
  }

  revalidatePath(`/final-invoice/${projectId}`);
  return { success: true };
}

export async function saveFinalInvoiceItemsAction(
  documentId: string,
  projectId: string,
  _state: FinalInvoiceActionState,
  formData: FormData
): Promise<FinalInvoiceActionState> {
  const user = await getCurrentUser();
  if (user.role === "visualizador") {
    return { error: "Você não tem permissão para editar esta tabela." };
  }

  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    // deixa o zod rejeitar o formato inválido abaixo
  }

  const parsed = FinalInvoiceItemsFormSchema.safeParse({ items });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await replaceFinalInvoiceItems(documentId, parsed.data.items);
  } catch (err) {
    return { error: getErrorMessage(err, "Erro ao salvar a tabela.") };
  }

  revalidatePath(`/final-invoice/${projectId}`);
  return { success: true };
}
