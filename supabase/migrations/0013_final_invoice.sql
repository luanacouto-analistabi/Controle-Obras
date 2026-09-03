-- 0013_final_invoice.sql
-- Tela "Final Invoice": cada projeto tem até uma "Lista de Preços" (PDF) por
-- categoria (PPU, Tubulação, Timesheets, Válvulas, Água Doce, Andaimes,
-- Armazenagem, Caixa Distribuição, Energia, Guindaste, Resíduo, Sewage).
-- O PDF enviado é tabulado em linhas editáveis, com 3 colunas extras além
-- das que já vêm no PDF (Preço unit./Preço total): Quantidade Atualizada,
-- Valor Atualizado e Observações do Estaleiro.
--
-- Reaproveita o bucket de storage "project-documents" (mesmo usado pelo
-- cronograma em project_documents), só muda o prefixo do path.

create table final_invoice_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  category text not null,
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now(),
  unique (project_id, category)
);
create index idx_final_invoice_documents_project on final_invoice_documents (project_id);

create table final_invoice_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references final_invoice_documents(id) on delete cascade,
  row_order int not null,
  item text,
  os text,
  description text not null default '',
  qty text,
  unit text,
  unit_price text,
  total_price text,
  updated_qty text,
  updated_value text,
  estaleiro_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_final_invoice_items_document on final_invoice_items (document_id);

create trigger set_updated_at before update on final_invoice_items
  for each row execute function set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────

alter table final_invoice_documents enable row level security;
alter table final_invoice_items enable row level security;

create policy "final_invoice_documents_select_authenticated" on final_invoice_documents
  for select to authenticated
  using (true);

create policy "final_invoice_documents_insert_admin_gestor" on final_invoice_documents
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "final_invoice_documents_update_admin_gestor" on final_invoice_documents
  for update to authenticated
  using (current_user_role() in ('admin', 'gestor'));

create policy "final_invoice_documents_delete_admin_gestor" on final_invoice_documents
  for delete to authenticated
  using (current_user_role() in ('admin', 'gestor'));

create policy "final_invoice_items_select_authenticated" on final_invoice_items
  for select to authenticated
  using (true);

create policy "final_invoice_items_insert_admin_gestor" on final_invoice_items
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "final_invoice_items_update_admin_gestor" on final_invoice_items
  for update to authenticated
  using (current_user_role() in ('admin', 'gestor'));

create policy "final_invoice_items_delete_admin_gestor" on final_invoice_items
  for delete to authenticated
  using (current_user_role() in ('admin', 'gestor'));
