-- 0003_measurement_billing_status.sql
-- Adiciona os status em texto de "Medição" e "Faturado" observados no
-- relatório de referência, e liga billing_events ao evento de pagamento
-- específico que ele fatura (em vez de só ao projeto). Reagendamento
-- (antecipação/adiamento) e mudança de valor continuam cobertos pelos
-- campos já existentes (billing_date/new_billing_date/billed_amount) +
-- project_change_history — não precisam de coluna nova.

create type measurement_status as enum
  ('pendente', 'em_analise', 'aprovada', 'reprovada');

create type billing_status as enum
  ('a_faturar', 'faturado', 'pendente');

alter table payment_events
  add column measurement_status measurement_status not null default 'pendente';

alter table billing_events
  add column payment_event_id uuid references payment_events(id) on delete cascade,
  add column billing_status billing_status not null default 'a_faturar';

create index idx_billing_events_payment_event on billing_events (payment_event_id);
