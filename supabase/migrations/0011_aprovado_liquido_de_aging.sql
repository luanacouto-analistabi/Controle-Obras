-- 0011_aprovado_liquido_de_aging.sql
-- O KPI "Aprovado" não pode somar de novo o que já foi classificado em
-- Pago/A Vencer/Vencido (isso duplicava o valor: um evento aprovado e
-- vencido aparecia tanto em "Aprovado" quanto em "Vencido"). A partir de
-- agora "Aprovado" mostra só os eventos aprovados que ainda não têm Data
-- Prevista de Pagamento definida (paid_date is null já era exigido antes;
-- falta excluir quem já tem data — esses já viraram A Vencer ou Vencido).

create or replace view project_financial_summary
with (security_invoker = true) as
select
  p.id as project_id,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'aprovado' and pe.paid_date is null
      and pe.expected_payment_date is null), 0) as approved_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'em_discussao'), 0)   as in_discussion_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'previsto'), 0)       as forecast_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'po_nao_emitida'), 0) as po_not_issued_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'po_sem_saldo'), 0)   as po_no_balance_amount,
  coalesce(sum(pe.paid_amount) filter (
    where pe.paid_date is not null), 0) as paid_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'aprovado' and pe.paid_date is null
      and pe.expected_payment_date >= current_date), 0) as upcoming_amount,
  coalesce(sum(pe.amount) filter (
    where pe.status = 'aprovado' and pe.paid_date is null
      and pe.expected_payment_date < current_date), 0)  as overdue_amount
from projects p
left join payment_events pe on pe.project_id = p.id
group by p.id;
