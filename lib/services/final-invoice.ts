import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { FinalInvoiceDocument, FinalInvoiceItem } from "@/types/database.types";
import type { FinalInvoiceCategory } from "@/lib/constants/final-invoice";

export type FinalInvoiceCategoryData = {
  document: FinalInvoiceDocument;
  items: FinalInvoiceItem[];
  signedUrl: string | null;
};

export type FinalInvoiceDataByCategory = Partial<
  Record<FinalInvoiceCategory, FinalInvoiceCategoryData>
>;

/** Documentos + linhas tabuladas de todas as categorias de um projeto, para a tela de detalhe do Final Invoice. */
export async function getFinalInvoiceDataByProject(
  projectId: string
): Promise<FinalInvoiceDataByCategory> {
  const supabase = await createClient();

  const { data: documents, error: documentsError } = await supabase
    .from("final_invoice_documents")
    .select("*")
    .eq("project_id", projectId);
  if (documentsError) throw documentsError;

  const documentIds = (documents ?? []).map((d) => d.id);
  const { data: items, error: itemsError } =
    documentIds.length > 0
      ? await supabase
          .from("final_invoice_items")
          .select("*")
          .in("document_id", documentIds)
          .order("row_order")
      : { data: [] as FinalInvoiceItem[], error: null };
  if (itemsError) throw itemsError;

  const itemsByDocument = new Map<string, FinalInvoiceItem[]>();
  for (const item of items ?? []) {
    const list = itemsByDocument.get(item.document_id) ?? [];
    list.push(item);
    itemsByDocument.set(item.document_id, list);
  }

  const result: FinalInvoiceDataByCategory = {};
  for (const document of documents ?? []) {
    const { data: signedUrlData } = await supabase.storage
      .from("project-documents")
      .createSignedUrl(document.storage_path, 60 * 10);
    result[document.category as FinalInvoiceCategory] = {
      document,
      items: itemsByDocument.get(document.id) ?? [],
      signedUrl: signedUrlData?.signedUrl ?? null,
    };
  }
  return result;
}
