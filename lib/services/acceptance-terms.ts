import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OsAcceptanceTerm } from "@/types/database.types";
import { sanitizeStorageFileName } from "@/lib/utils";

/** Termos de aceite já lançados para um projeto, indexados por cod_os. */
export async function listOsAcceptanceTerms(
  projectId: string
): Promise<Record<string, OsAcceptanceTerm>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("os_acceptance_terms")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw error;

  const byOs: Record<string, OsAcceptanceTerm> = {};
  for (const row of data ?? []) {
    byOs[row.cod_os] = row;
  }
  return byOs;
}

/**
 * Salva a data de assinatura e/ou o PDF do termo de aceite de uma OS.
 * Upsert por (project_id, cod_os) — sem PDF/motivo de cronograma, isso não
 * é uma mudança de projeto, é um registro operacional por OS.
 */
export async function saveOsAcceptanceTerm(
  projectId: string,
  codOs: string,
  opts: { signedAt: string | null; documentFile: File | null; userId: string }
) {
  const supabase = await createClient();

  let fileFields: { file_name: string; storage_path: string; uploaded_by: string; uploaded_at: string } | null =
    null;

  if (opts.documentFile) {
    const safeFileName = sanitizeStorageFileName(opts.documentFile.name);
    const storagePath = `${projectId}/termos-aceite/${codOs}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(storagePath, opts.documentFile, { contentType: "application/pdf" });
    if (uploadError) {
      throw new Error(
        `Falha ao enviar o PDF (o bucket "project-documents" existe no Storage?): ${uploadError.message}`
      );
    }
    fileFields = {
      file_name: opts.documentFile.name,
      storage_path: storagePath,
      uploaded_by: opts.userId,
      uploaded_at: new Date().toISOString(),
    };
  }

  const { error } = await supabase.from("os_acceptance_terms").upsert(
    {
      project_id: projectId,
      cod_os: codOs,
      signed_at: opts.signedAt,
      updated_by: opts.userId,
      ...(fileFields ?? {}),
    },
    { onConflict: "project_id,cod_os" }
  );
  if (error) throw error;
}

/** URL assinada (temporária) para baixar o PDF de um termo de aceite. */
export async function getAcceptanceTermSignedUrl(
  storagePath: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(storagePath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
