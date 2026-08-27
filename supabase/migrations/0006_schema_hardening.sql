-- 0006_schema_hardening.sql
-- Auditoria do schema acumulado (0001-0005): corrige um bug real de perda
-- de dado, fecha lacunas de integridade referencial, adiciona checks que
-- faltavam e documenta as tabelas.

-- ─── BUG: billing_events.payment_event_id estava ON DELETE CASCADE ──────
-- Editar Bloco 2 em Configuração e remover um evento de pagamento apagava
-- silenciosamente o faturamento (Bloco 3) já lançado pra ele. Troca pra
-- RESTRICT: a exclusão do evento de pagamento passa a falhar (com erro
-- tratado na aplicação) em vez de destruir o registro financeiro.
alter table billing_events
  drop constraint if exists billing_events_payment_event_id_fkey;
alter table billing_events
  add constraint billing_events_payment_event_id_fkey
  foreign key (payment_event_id) references payment_events(id)
  on delete restrict;

-- ─── FKs "quem fez" apontando pra profiles: SET NULL em vez de bloquear ──
-- Sem isso, excluir um usuário (Administração > Usuários) falha assim que
-- ele tiver criado/alterado qualquer coisa — o que na prática é sempre.
alter table projects drop constraint if exists projects_created_by_fkey;
alter table projects add constraint projects_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;

alter table projects drop constraint if exists projects_updated_by_fkey;
alter table projects add constraint projects_updated_by_fkey
  foreign key (updated_by) references profiles(id) on delete set null;

alter table project_documents
  drop constraint if exists project_documents_uploaded_by_fkey;
alter table project_documents add constraint project_documents_uploaded_by_fkey
  foreign key (uploaded_by) references profiles(id) on delete set null;

alter table project_change_history
  drop constraint if exists project_change_history_user_id_fkey;
alter table project_change_history add constraint project_change_history_user_id_fkey
  foreign key (user_id) references profiles(id) on delete set null;

alter table project_change_history
  drop constraint if exists project_change_history_document_id_fkey;
alter table project_change_history add constraint project_change_history_document_id_fkey
  foreign key (document_id) references project_documents(id) on delete set null;

alter table os_acceptance_terms
  drop constraint if exists os_acceptance_terms_uploaded_by_fkey;
alter table os_acceptance_terms add constraint os_acceptance_terms_uploaded_by_fkey
  foreign key (uploaded_by) references profiles(id) on delete set null;

alter table os_acceptance_terms
  drop constraint if exists os_acceptance_terms_updated_by_fkey;
alter table os_acceptance_terms add constraint os_acceptance_terms_updated_by_fkey
  foreign key (updated_by) references profiles(id) on delete set null;

-- ─── Checks que faltavam ──────────────────────────────────────────────
alter table billing_events
  add constraint billed_amount_non_negative check (billed_amount >= 0);
alter table billing_events
  add constraint overdue_amount_non_negative check (overdue_amount >= 0);
alter table payment_events
  add constraint paid_amount_non_negative check (paid_amount is null or paid_amount >= 0);
alter table os_acceptance_terms
  add constraint file_fields_consistent
  check ((file_name is null) = (storage_path is null));

-- ─── RLS: faltava delete em os_acceptance_terms (só admin) ─────────────
create policy "os_acceptance_terms_delete" on os_acceptance_terms
  for delete to authenticated
  using (current_user_role() = 'admin');

-- ─── Documentação ───────────────────────────────────────────────────────
comment on table profiles is 'Perfis de usuário (papel/role) — 1:1 com auth.users.';
comment on table projects is 'Projeto/obra — um registro por CC (Bloco 1).';
comment on table payment_events is 'Bloco 2 (Informações de Pagamento) — vários por projeto.';
comment on table billing_events is 'Bloco 3 (Informações de Faturamento) — cada linha se refere a um payment_event específico via payment_event_id.';
comment on table project_documents is 'Versões do cronograma PDF anexado a um projeto — imutável, nunca sobrescrito.';
comment on table project_change_history is 'Auditoria: diff campo a campo de alterações em Bloco 1/2, com motivo e documento anexado.';
comment on table os_acceptance_terms is 'Termo de aceite por OS (cod_os da EAP) de um projeto — data de assinatura + PDF, upsert por (project_id, cod_os).';
comment on column payment_events.status is 'Estágio de aprovação/PO do pagamento — definido manualmente pelo coordenador, não vem do PDF/EAP.';
comment on column billing_events.payment_event_id is 'A qual evento de pagamento este faturamento se refere — definido na tela Atualização Faturamento.';
