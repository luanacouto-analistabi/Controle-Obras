-- 0002_cc_format.sql
-- CC é sempre 6 dígitos numéricos, sem ponto (ex.: "020227"), conforme a
-- convenção usada nas APIs Maua SCP (EAP) e nos relatórios existentes.

alter table projects
  add constraint cc_format check (cc ~ '^[0-9]{6}$');
