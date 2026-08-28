-- 0012_invoice_fields_to_billing.sql
-- Nº da Invoice e Data da Invoice são atributos da fatura emitida (Bloco 3
-- — Faturamento), não da parcela combinada no cronograma (Bloco 2 —
-- Pagamento). Move as duas colunas de payment_events para billing_events,
-- migrando qualquer valor já cadastrado antes de remover as colunas
-- antigas.

alter table billing_events
  add column invoice_number text,
  add column invoice_date date;

update billing_events be
set invoice_number = pe.invoice_number,
    invoice_date = pe.invoice_date
from payment_events pe
where be.payment_event_id = pe.id
  and (pe.invoice_number is not null or pe.invoice_date is not null);

alter table payment_events
  drop column invoice_number,
  drop column invoice_date;

comment on column billing_events.invoice_number is 'Número da invoice emitida para este faturamento.';
comment on column billing_events.invoice_date is 'Data de emissão da invoice deste faturamento.';
