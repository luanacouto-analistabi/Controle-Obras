-- 0010_vencido_a_vencer_somente_aprovado.sql
-- Redesenha A Vencer/Vencido: só entram eventos com Status = 'aprovado' e
-- Data Prevista de Pagamento preenchida — comparando essa data com hoje
-- decide se caem em "a vencer" ou "vencido". Eventos Previsto/Em
-- Discussão/PO Não Emitida/PO Sem Saldo não entram nessas duas colunas
-- (já têm seus próprios KPIs).
--
-- Pago volta a ser definido só pela Data de Pagamento preenchida, sem
-- filtro de status — não existe um status "pago" no sistema (o status
-- continua 'aprovado' mesmo depois de pago), então filtrar por status
-- aqui zerava pagamentos reais.

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
