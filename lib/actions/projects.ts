"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProjectFormSchema } from "@/lib/validators/project";
import { createProject, updateProject } from "@/lib/services/project-mutations";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getErrorMessage } from "@/lib/utils";

export type ProjectFormState = { error?: string } | undefined;

function parseFormPayload(formData: FormData) {
  const general = {
    cc: String(formData.get("cc") ?? ""),
    project_coordinator: String(formData.get("project_coordinator") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
    vessel_name: String(formData.get("vessel_name") ?? ""),
    client: String(formData.get("client") ?? ""),
  };

  let paymentEvents: unknown = [];
  try {
    paymentEvents = JSON.parse(String(formData.get("paymentEvents") ?? "[]"));
  } catch {
    // deixa o zod rejeitar o formato inválido abaixo
  }

  return { general, paymentEvents };
}

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (user.role === "visualizador") {
    return { error: "Você não tem permissão para criar projetos." };
  }

  const parsed = ProjectFormSchema.safeParse(parseFormPayload(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let projectId: string;
  try {
    const project = await createProject(parsed.data, user.id);
    projectId = project.id;
  } catch (err) {
    return { error: getErrorMessage(err, "Erro ao criar projeto.") };
  }

  revalidatePath("/configuracao");
  revalidatePath("/");
  redirect(`/configuracao/${projectId}`);
}

export async function updateProjectAction(
  projectId: string,
  _state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (user.role === "visualizador") {
    return { error: "Você não tem permissão para editar projetos." };
  }

  const reason = String(formData.get("change_reason") ?? "").trim();
  const document = formData.get("document");
  const documentFile =
    document instanceof File && document.size > 0 ? document : null;

  if (!reason) {
    return { error: "Informe o motivo da alteração/postergação." };
  }
  if (documentFile && documentFile.type !== "application/pdf") {
    return { error: "O cronograma deve ser um arquivo PDF." };
  }

  const parsed = ProjectFormSchema.safeParse(parseFormPayload(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateProject(projectId, parsed.data, {
      reason,
      documentFile,
      userId: user.id,
    });
  } catch (err) {
    return { error: getErrorMessage(err, "Erro ao salvar alteração.") };
  }

  revalidatePath(`/configuracao/${projectId}`);
  revalidatePath("/configuracao");
  revalidatePath("/");
  redirect(`/configuracao/${projectId}`);
}
