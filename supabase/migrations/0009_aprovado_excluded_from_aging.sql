-- 0009_aprovado_excluded_from_aging.sql
-- Substitui a regra da 0008: Pago, A Vencer e Vencido não devem contar
-- eventos com status='aprovado' — um evento já aprovado é reportado no
-- KPI "Aprovado" e não deve, além disso, ser contado como vencido/a vencer
-- só porque ainda não foi baixado como pago. A exclusão de 'previsto'
-- introduzida na 0008 é removida (eventos previstos voltam a entrar no
-- aging normalmente).

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
    where pe.paid_date is not null and pe.status <> 'aprovado'), 0) as paid_amount,
  coalesce(sum(pe.amount) filter (
    where pe.paid_date is null and pe.status <> 'aprovado'
      and pe.expected_payment_date >= current_date), 0) as upcoming_amount,
  coalesce(sum(pe.amount) filter (
    where pe.paid_date is null and pe.status <> 'aprovado'
      and pe.expected_payment_date < current_date), 0)  as overdue_amount
from projects p
left join payment_events pe on pe.project_id = p.id
group by p.id;
