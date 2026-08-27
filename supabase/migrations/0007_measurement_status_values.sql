-- 0007_measurement_status_values.sql
-- "Status da Medição" no Bloco 2 substitui o campo livre "Data da
-- Medição" por uma lista de status. Os valores de measurement_status
-- criados em 0003 (pendente/em_analise/aprovada/reprovada) não eram os
-- certos — trocando pelos 3 que o formulário realmente usa, espelhando
-- os mesmos nomes já usados em payment_events.status.

alter type measurement_status rename to measurement_status_old;
create type measurement_status as enum ('aprovada', 'em_discussao', 'prevista');

alter table payment_events alter column measurement_status drop default;
alter table payment_events alter column measurement_status type measurement_status
  using (
    case measurement_status::text
      when 'aprovada' then 'aprovada'
      when 'em_analise' then 'em_discussao'
      when 'reprovada' then 'em_discussao'
      else 'prevista'
    end
  )::measurement_status;
alter table payment_events alter column measurement_status set default 'prevista';

drop type measurement_status_old;
