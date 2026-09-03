-- 0014_final_invoice_item_levels.sql
-- Hierarquia da "Lista de Preços" tabulada: 1 = seção (ex.: "A FACILIDADES"),
-- 2 = item numerado, 3 = sublinha do item, 4 = observação. O nível 1 mostra
-- o subtotal de "Preço total R$" somado dos itens (nível 2) daquela seção —
-- calculado na tela a partir das linhas, não precisa de coluna própria.

alter table final_invoice_items
  add column level smallint not null default 2
    constraint final_invoice_items_level_check check (level between 1 and 4);
