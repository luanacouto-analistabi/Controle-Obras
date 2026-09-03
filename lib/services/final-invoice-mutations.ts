import "server-only";

import { createClient } from "@/lib/supabase/server";
import { parseFinalInvoicePdf } from "@/lib/services/final-invoice-pdf";
import type { FinalInvoiceCategory } from "@/lib/constants/final-invoice";
import { sanitizeStorageFileName } from "@/lib/utils";

export type FinalInvoiceItemInput = {
  item: string;
  os: string;
  description: string;
  qty: string;
  unit: string;
  unit_price: string;
  total_price: string;
  updated_qty: string;
  updated_value: string;
  estaleiro_notes: string;
};

/**
 * Sobe o PDF pro storage (bucket "project-documents", reaproveitado do
 * cronograma), tabula as linhas e substitui o documento/linhas anteriores
 * dessa categoria, se houver.
 */
export async function replaceFinalInvoiceDocument(
  projectId: string,
  category: FinalInvoiceCategory,
  file: File,
  userId: string
) {
  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const parsedRows = await parseFinalInvoicePdf(bytes);

  const safeCategory = sanitizeStorageFileName(category);
  const safeFileName = sanitizeStorageFileName(file.name);
  const storagePath = `${projectId}/final-invoice/${safeCategory}/${Date.now()}-${safeFileName}`;
  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, bytes, { contentType: "application/pdf" });
  if (uploadError) {
    throw new Error(
      `Falha ao enviar o PDF (o bucket "project-documents" existe no Storage?): ${uploadError.message}`
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("final_invoice_documents")
    .upsert(
      {
        project_id: projectId,
        category,
        file_name: file.name,
        storage_path: storagePath,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "project_id,category" }
    )
    .select()
    .single();
  if (documentError) throw documentError;

  const { error: deleteError } = await supabase
    .from("final_invoice_items")
    .delete()
    .eq("document_id", document.id);
  if (deleteError) throw deleteError;

  if (parsedRows.length > 0) {
    const { error: insertError } = await supabase.from("final_invoice_items").insert(
      parsedRows.map((row, index) => ({
        document_id: document.id,
        row_order: index,
        item: row.item,
        os: row.os,
        description: row.description,
        qty: row.qty,
        unit: row.unit,
        unit_price: row.unit_price,
        total_price: row.total_price,
        updated_qty: "",
        updated_value: "",
        estaleiro_notes: "",
      }))
    );
    if (insertError) throw insertError;
  }

  return document;
}

/** Substitui as linhas de um documento pelo conjunto editado na tela (inclui as 3 colunas extras). */
export async function replaceFinalInvoiceItems(
  documentId: string,
  items: FinalInvoiceItemInput[]
) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("final_invoice_items")
    .delete()
    .eq("document_id", documentId);
  if (deleteError) throw deleteError;

  if (items.length === 0) return;

  const { error: insertError } = await supabase.from("final_invoice_items").insert(
    items.map((item, index) => ({
      document_id: documentId,
      row_order: index,
      ...item,
    }))
  );
  if (insertError) throw insertError;
}
