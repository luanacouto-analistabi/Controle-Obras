# Documentação da Aplicação — Controle de Obras

Sistema de Controle de Projetos, Pagamentos e Faturamento do Estaleiro Mauá.
Este documento descreve a arquitetura técnica, o modelo de dados e as regras
de negócio implementadas. Para um guia de uso do dia a dia, veja
[GUIA_DO_USUARIO.md](./GUIA_DO_USUARIO.md).

## 1. Visão geral

O sistema centraliza, por Centro de Custo (CC), as informações de:

- **Cronograma/escopo** do projeto (Bloco 1 — Informações Gerais)
- **Eventos de pagamento** previstos no contrato (Bloco 2 — Informações de
  Pagamento)
- **Faturamento** efetivamente lançado contra esses eventos (Bloco 3 —
  Informações de Faturamento)
- **Termo de aceite** por Ordem de Serviço (OS)
- Um **painel consolidado** com a situação financeira de todos os projetos
- Um **cronograma semanal de previsão de faturamento**

Toda alteração em Bloco 1/2 fica registrada em um histórico de auditoria
(quem mudou, quando, o quê, por quê, e com qual cronograma anexado).

## 2. Stack tecnológica

- **Next.js 16 (App Router)** com Server/Client Components e Server Actions
- **React 19 + TypeScript**
- **Tailwind CSS v4** — tokens de design herdados do design system "Metas
  Mauá 2026" (ver `DESIGN_SYSTEM.md`)
- **Supabase** (Postgres + Auth + Storage + Row Level Security)
- **Zod v4** para validação de formulários/Server Actions
- **lucide-react** para ícones
- Deploy alvo: **Vercel**

## 3. Estrutura de pastas

```
app/
  (dashboard)/            # todas as telas autenticadas, com sidebar
    page.tsx              # Consolidado de Projetos ("/")
    configuracao/
      page.tsx            # lista de projetos
      novo/page.tsx        # criar projeto
      [id]/page.tsx        # editar projeto (Bloco 1+2+3)
    termo-aceite/
      page.tsx            # lista de projetos
      [id]/page.tsx        # termo de aceite por OS
    cronograma-faturamento/page.tsx
    projetos/[id]/page.tsx # detalhe/drilldown de um projeto
    layout.tsx             # sidebar + shell autenticado
  login/                  # tela pública de login
components/
  configuracao/project-form.tsx     # Bloco 1 + 2
  faturamento/billing-form.tsx      # Bloco 3
  termo-aceite/os-acceptance-row.tsx
  dashboard/{kpi-cards,projects-summary-table}.tsx
  projetos/payment-events-table.tsx
  filters/client-filter.tsx         # dropdown de filtro por cliente
  layout/main-nav.tsx
lib/
  actions/          # Server Actions (projects.ts, billing.ts, acceptance-terms.ts, auth.ts)
  services/         # lógica de acesso a dados (projects.ts, project-mutations.ts,
                     # billing-schedule.ts, acceptance-terms.ts, maua-scp.ts)
  validators/project.ts   # schemas Zod
  supabase/{client,server,dal}.ts
supabase/migrations/      # migrations SQL, aplicadas manualmente no SQL Editor
types/database.types.ts   # tipos TypeScript escritos à mão a partir do schema
```

## 4. Modelo de dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `profiles` | Usuário + papel (`admin` / `gestor` / `visualizador`) |
| `projects` | Um registro por CC — Bloco 1 |
| `payment_events` | Parcelas de pagamento do contrato — Bloco 2 |
| `billing_events` | Faturamentos lançados contra um `payment_event` — Bloco 3 |
| `project_documents` | Versões do PDF de cronograma anexadas nas edições |
| `project_change_history` | Auditoria campo a campo de Bloco 1/2/3 |
| `os_acceptance_terms` | Termo de aceite assinado por OS da EAP |
| `project_financial_summary` (view) | Agregados financeiros por projeto, usados no Consolidado |

### `projects` (Bloco 1)

`cc` (6 dígitos), `project_coordinator`, `client`, `vessel_name`,
`start_date`, `end_date`, `status`, `created_by`/`updated_by`.

### `payment_events` (Bloco 2)

| Campo | Observação |
|---|---|
| `payment_event` | Lista fixa: "Parcela Contratual", "VOR - 50%", "VOR - 100%" |
| `invoice_description` | Descrição livre da invoice |
| `payment_condition` | Texto livre (ex.: "10 dias") |
| `expected_payment_date` | Data Prevista de Pagamento — chave de toda a "aging" |
| `amount` | Valor da parcela |
| `status` | `previsto` \| `em_discussao` \| `aprovado` \| `po_nao_emitida` \| `po_sem_saldo` |
| `measurement_status` | `aprovada` \| `em_discussao` \| `prevista` — status da medição, **não** usado em nenhum cálculo financeiro hoje, é só informativo |
| `po_issued` | boolean |
| `paid_date` / `paid_amount` | Preenchidos **somente** pelo Status (Pago/Não pago) do Bloco 3 — ver seção 5 |

`invoice_number`/`invoice_date` **não existem mais aqui** — foram movidos
para `billing_events` na migration 0012 (são atributos da invoice emitida,
não da parcela combinada).

### `billing_events` (Bloco 3)

`payment_event_id` (a qual parcela este faturamento se refere),
`billing_date`, `billed_amount` (= sempre o `amount` da parcela
selecionada, calculado automaticamente, nunca digitado),
`invoice_number`, `invoice_date`, `new_billing_date` (só relevante
quando o Status é "Não pago"), `overdue_amount` (coluna legada, não
gerenciada pela interface).

Quando um faturamento é lançado marcando **múltiplas parcelas** de uma vez,
cada parcela vira sua própria linha em `billing_events` (a primeira
reaproveita o registro existente em caso de edição, as demais são novas).

### Enums

```
user_role:          admin | gestor | visualizador
payment_status:      previsto | em_discussao | aprovado | po_nao_emitida | po_sem_saldo
measurement_status:   aprovada | em_discussao | prevista
document_type:        cronograma | outro
project_status:       ativo | concluido | cancelado
```

## 5. Regras de negócio financeiras

Esta é a parte que mais mudou ao longo do projeto (migrations 0008 → 0011) —
o comportamento **atual e definitivo** é este:

### Classificação por Status (Bloco 2)

O KPI/coluna de cada status (Previsto, Em Discussão, PO Não Emitida, PO Sem
Saldo) é simplesmente a soma de `amount` dos eventos com aquele `status`.

### Aprovado / A Vencer / Vencido / Pago

Só eventos com **Status = Aprovado** entram nessa cadeia:

- **A Vencer**: `status = 'aprovado'`, `paid_date` vazio, `expected_payment_date >= hoje`
- **Vencido**: `status = 'aprovado'`, `paid_date` vazio, `expected_payment_date < hoje`
- **Aprovado** (KPI): `status = 'aprovado'`, `paid_date` vazio, **e** `expected_payment_date` **vazio** — ou seja, o KPI "Aprovado" não soma de novo o que já apareceu em A Vencer/Vencido (evita duplicar o valor no Consolidado)
- **Pago**: qualquer evento com `paid_date` preenchido, **independente do status** — não existe um status "pago" no sistema

Eventos com Status = Previsto/Em Discussão/PO Não Emitida/PO Sem Saldo
**nunca** entram em A Vencer/Vencido — eles só contam para seus próprios
KPIs. Isso vale mesmo que a Data Prevista de Pagamento já tenha passado.

A definição completa está na view `project_financial_summary`
(`supabase/migrations/0011_aprovado_liquido_de_aging.sql`).

### Como `paid_date`/`paid_amount` são preenchidos

O **único** lugar da interface que grava esses dois campos é o **Status
(Pago/Não pago)** de cada linha do Bloco 3 (Faturamento):

- Status = **Pago** → grava `paid_date` = Data Real de Pagamento informada
  (campo opcional) e `paid_amount` = valor da parcela.
- Status = **Não pago** → limpa os dois campos.

Como uma linha de faturamento pode cobrir várias parcelas ao mesmo tempo,
marcar "Pago" atualiza o `payment_event` de **cada** parcela selecionada
naquele lançamento.

### Cronograma de Faturamento (cores)

Cada célula (semana × projeto) é classificada, célula a célula por evento,
com a mesma lógica de pago/vencido/previsto — só que aqui **qualquer
status** de pagamento entra (não só Aprovado), pois o cronograma é uma
previsão de fluxo de caixa, não uma cobrança de aging:

- verde = pago (`paid_date` preenchido)
- amarelo = previsto (sem `paid_date`, data ainda não passou)
- vermelho = vencido (sem `paid_date`, data já passou)

Quando uma célula soma eventos em estados diferentes, prevalece o mais
"urgente": vencido > previsto > pago.

## 6. Papéis e permissões

| Papel | Pode editar Bloco 1/2/3 e Termo de Aceite | Só visualizar |
|---|---|---|
| `admin` | Sim | — |
| `gestor` | Sim | — |
| `visualizador` | Não | Sim |

Controle de acesso via RLS no Postgres (`current_user_role()`) e checagem
de papel nas Server Actions (`lib/supabase/dal.ts` → `getCurrentUser()`).

## 7. Páginas

| Rota | Descrição |
|---|---|
| `/` | Consolidado — KPIs + tabela por projeto, com filtro por cliente |
| `/configuracao` | Lista de projetos (CC, Obra, Cliente, Coordenador, Valor Total, Última Alteração) |
| `/configuracao/novo` | Criar projeto |
| `/configuracao/[id]` | Editar projeto — Bloco 1 + 2 (histórico em tabela + Adicionar/Editar), Bloco 3 logo abaixo, "Confirmar alteração" (motivo obrigatório + PDF opcional) ao final |
| `/termo-aceite` | Lista de projetos |
| `/termo-aceite/[id]` | Data de assinatura + upload do termo por OS da EAP |
| `/cronograma-faturamento` | Pivot semanal por projeto/categoria (Escopo/VOR), com filtro por cliente e navegação de mês |
| `/projetos/[id]` | Detalhe do projeto — eventos de pagamento com drilldown de OS da EAP concluídas até a Data Prevista de Pagamento |

## 8. Integrações externas

APIs internas da Maua SCP (`lib/services/maua-scp.ts`), autenticadas via
Bearer token:

- `Maua_Eap.php` — alimenta os dropdowns de CC/Embarcação em Configuração e
  o drilldown de OS em `/projetos/[id]`
- `Maua_Timesheet.php` — reservada para uso futuro

Não há sincronização com o banco — a API é consultada ao vivo, com cache
em memória de 5 minutos.

## 9. Auditoria

Toda alteração em Bloco 1/2 (via `/configuracao/[id]`) exige um motivo e
grava um diff campo a campo em `project_change_history`, associado
opcionalmente ao documento (PDF do cronograma) daquela edição. Alterações
em Bloco 3 (Faturamento) e no Termo de Aceite também geram histórico, mas
sem exigir motivo/PDF (não são mudanças de cronograma).

## 10. Particularidades conhecidas

- O repositório vive dentro de uma pasta sincronizada pelo OneDrive, o que
  ocasionalmente corrompe o cache `.next` do Next.js ("Slow filesystem
  detected"). Se o dev server apresentar comportamento estranho (rotas
  404 que existem no disco, erros de tipo incoerentes), rode:
  `taskkill //F //IM node.exe && rm -rf .next && npx next typegen`.
- As migrations em `supabase/migrations/` não são aplicadas
  automaticamente — cada uma precisa ser colada manualmente no SQL Editor
  do Supabase.
