-- 0005_os_acceptance_terms.sql
-- Termo de aceite por OS (cod_os da EAP) de um projeto — data de
-- assinatura + PDF anexado, um registro por (projeto, OS). Independente
-- de payment_events/billing_events: uma OS pode não ter nenhum evento de
-- pagamento ligado a ela ainda.

create table os_acceptance_terms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  cod_os text not null,
  signed_at date,
  file_name text,
  storage_path text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id),
  unique (project_id, cod_os)
);

create index idx_os_acceptance_terms_project on os_acceptance_terms (project_id);

create trigger set_updated_at before update on os_acceptance_terms
  for each row execute function set_updated_at();

alter table os_acceptance_terms enable row level security;

create policy "os_acceptance_terms_select" on os_acceptance_terms
  for select to authenticated
  using (true);

create policy "os_acceptance_terms_insert" on os_acceptance_terms
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "os_acceptance_terms_update" on os_acceptance_terms
  for update to authenticated
  using (current_user_role() in ('admin', 'gestor'));
