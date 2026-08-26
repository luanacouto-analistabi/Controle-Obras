-- 0001_init.sql
-- Schema inicial: perfis, projetos, pagamentos, faturamento, documentos e
-- histórico de alterações. Ver especificação (seção 05/06/10) para o
-- raciocínio por trás de cada regra.

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'gestor', 'visualizador');
create type payment_status as enum
  ('previsto', 'em_discussao', 'aprovado', 'po_nao_emitida', 'po_sem_saldo');
create type document_type as enum ('cronograma', 'outro');
create type project_status as enum ('ativo', 'concluido', 'cancelado');

-- ─── Tabelas ────────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'visualizador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  cc text not null,
  project_coordinator text not null,
  start_date date not null,
  end_date date not null,
  vessel_name text not null,
  client text not null,
  status project_status not null default 'ativo',
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id),
  constraint end_after_start check (end_date >= start_date)
);
create index idx_projects_cc on projects (cc);
create index idx_projects_client on projects (client);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  payment_event text not null,
  invoice_description text,
  invoice_date date,
  payment_condition text,
  expected_payment_date date,
  amount numeric(14, 2) not null check (amount >= 0),
  measurement_date date,
  po_issued boolean not null default false,
  invoice_number text,
  status payment_status not null default 'previsto',
  paid_amount numeric(14, 2),
  paid_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payment_events_project on payment_events (project_id);
create index idx_payment_events_expected on payment_events (expected_payment_date);

create table billing_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  billing_date date not null,
  billed_amount numeric(14, 2) not null default 0,
  overdue_amount numeric(14, 2) not null default 0,
  new_billing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_billing_events_project on billing_events (project_id);

create table project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  version int not null,
  document_type document_type not null default 'cronograma',
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now(),
  unique (project_id, version)
);

create table project_change_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid references profiles(id),
  changed_at timestamptz not null default now(),
  field_name text not null,
  old_value text,
  new_value text,
  change_reason text,
  document_id uuid references project_documents(id)
);
create index idx_change_history_project on project_change_history (project_id);

-- ─── View de suporte ao dashboard (seção 06) ───────────────────────────

create or replace view project_financial_summary
with (security_invoker = true) as
select
  p.id as project_id,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'aprovado' and pe.paid_date is null), 0) as approved_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'em_discussao'), 0)   as in_discussion_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'previsto'), 0)       as forecast_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'po_nao_emitida'), 0) as po_not_issued_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'po_sem_saldo'), 0)   as po_no_balance_amount,
  coalesce(sum(pe.paid_amount) filter (
    where pe.paid_date is not null), 0)     as paid_amount,
  coalesce(sum(pe.amount) filter (
    where pe.paid_date is null
      and pe.expected_payment_date >= current_date), 0) as upcoming_amount,
  coalesce(sum(pe.amount) filter (
    where pe.paid_date is null
      and pe.expected_payment_date < current_date), 0)  as overdue_amount
from projects p
left join payment_events pe on pe.project_id = p.id
group by p.id;

-- ─── updated_at automático ──────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger set_updated_at before update on payment_events
  for each row execute function set_updated_at();
create trigger set_updated_at before update on billing_events
  for each row execute function set_updated_at();

-- ─── current_user_role() — evita recursão de RLS em profiles ───────────

create or replace function current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table projects enable row level security;
alter table payment_events enable row level security;
alter table billing_events enable row level security;
alter table project_documents enable row level security;
alter table project_change_history enable row level security;

-- profiles: o próprio usuário lê seu perfil; admin lê/edita todos
create policy "profiles_select_own_or_admin" on profiles
  for select to authenticated
  using (id = auth.uid() or current_user_role() = 'admin');

create policy "profiles_write_admin" on profiles
  for insert to authenticated
  with check (current_user_role() = 'admin');

create policy "profiles_update_admin" on profiles
  for update to authenticated
  using (current_user_role() = 'admin');

create policy "profiles_delete_admin" on profiles
  for delete to authenticated
  using (current_user_role() = 'admin');

-- projects: leitura para todos autenticados; escrita para admin/gestor
create policy "projects_select_authenticated" on projects
  for select to authenticated
  using (true);

create policy "projects_insert_admin_gestor" on projects
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "projects_update_admin_gestor" on projects
  for update to authenticated
  using (current_user_role() in ('admin', 'gestor'));

create policy "projects_delete_admin" on projects
  for delete to authenticated
  using (current_user_role() = 'admin');

-- payment_events: mesmas regras de projects
create policy "payment_events_select_authenticated" on payment_events
  for select to authenticated
  using (true);

create policy "payment_events_insert_admin_gestor" on payment_events
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "payment_events_update_admin_gestor" on payment_events
  for update to authenticated
  using (current_user_role() in ('admin', 'gestor'));

create policy "payment_events_delete_admin" on payment_events
  for delete to authenticated
  using (current_user_role() = 'admin');

-- billing_events: mesmas regras de projects
create policy "billing_events_select_authenticated" on billing_events
  for select to authenticated
  using (true);

create policy "billing_events_insert_admin_gestor" on billing_events
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "billing_events_update_admin_gestor" on billing_events
  for update to authenticated
  using (current_user_role() in ('admin', 'gestor'));

create policy "billing_events_delete_admin" on billing_events
  for delete to authenticated
  using (current_user_role() = 'admin');

-- project_documents: leitura para todos; upload para admin/gestor; sem
-- update (nova versão = nova linha); delete restrito ao admin
create policy "project_documents_select_authenticated" on project_documents
  for select to authenticated
  using (true);

create policy "project_documents_insert_admin_gestor" on project_documents
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));

create policy "project_documents_delete_admin" on project_documents
  for delete to authenticated
  using (current_user_role() = 'admin');

-- project_change_history: leitura para todos; insert para admin/gestor;
-- imutável — nenhuma policy de update/delete é criada de propósito
create policy "project_change_history_select_authenticated" on project_change_history
  for select to authenticated
  using (true);

create policy "project_change_history_insert_admin_gestor" on project_change_history
  for insert to authenticated
  with check (current_user_role() in ('admin', 'gestor'));
