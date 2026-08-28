# Guia de Uso — Controle de Obras

Sistema de Controle de Projetos, Pagamentos e Faturamento do Estaleiro Mauá.
Este guia explica como usar cada tela do dia a dia. Para detalhes técnicos,
veja [DOCUMENTACAO.md](./DOCUMENTACAO.md).

## Acesso

Faça login com seu e-mail e senha cadastrados. Seu **papel** define o que
você pode fazer:

- **Administrador** e **Gestor**: podem cadastrar e editar tudo.
- **Visualizador**: só consegue ver as informações, sem editar nada.

## Menu lateral

- **Consolidado** — visão geral financeira de todos os projetos.
- **Configuração** — cadastro e edição dos projetos (CC, pagamentos, faturamento).
- **Atualização Termo de Aceite** — assinatura do termo por OS.
- **Cronograma de Faturamento** — previsão semanal de faturamento.

## 1. Consolidado de Projetos

Tela inicial do sistema.

- **Filtro por Cliente**, no topo direito: mostra só os projetos daquele
  cliente. Selecione "Todos os clientes" para voltar a ver tudo.
- **Cards do topo**: somam os valores de todos os projetos filtrados.
  - **Aprovado**: valor já aprovado, mas ainda sem data prevista de
    pagamento definida.
  - **Em Discussão** / **Previsto**: valores nesses status, ainda não
    aprovados.
  - **Pago**: soma de tudo que já tem Data Real de Pagamento lançada
    (isso é feito em Configuração → Bloco 3 → Status "Pago").
  - **A Vencer**: valor aprovado com Data Prevista de Pagamento ainda no
    futuro.
  - **Vencido**: valor aprovado cuja Data Prevista de Pagamento já passou
    e ainda não foi pago.
- **Tabela**: mesmos valores, abertos por projeto (CC, Obra, Cliente), com
  colunas de Medição (Aprovada/Em Discussão/Prevista), Emissão de PO e a
  situação Aprovada (Pago/A Vencer/Vencido). Clique no CC para abrir o
  detalhe do projeto.

> **Por que um valor aprovado não aparece em "Vencido"?** Porque ele ainda
> não tem Data Prevista de Pagamento preenchida em Configuração — enquanto
> não tiver uma data, ele fica só no card "Aprovado".

## 2. Configuração

Lista todos os projetos cadastrados (CC, Obra, Cliente, Coordenador, Valor
Total do contrato, última alteração). Clique em **+ Novo projeto** para
cadastrar um CC novo, ou no CC de um projeto existente para editá-lo.

### Bloco 1 — Informações Gerais

CC (escolhido de uma lista vinda da EAP), Coordenador do Projeto, Cliente,
Nome da Embarcação (também da EAP, filtrado pelo CC escolhido), Data
Início e Data Fim.

### Bloco 2 — Informações de Pagamento

Lista as parcelas do contrato em formato de **tabela** (histórico). Para
adicionar uma parcela nova, clique em **+ Adicionar pagamento** — um
formulário aparece abaixo da tabela só para aquela parcela. Para alterar
uma parcela já existente, clique em **Editar** na linha dela: só aquele
registro fica editável, o resto continua na tabela. Ao terminar, clique em
**Concluir edição**.

Campos de cada parcela:

- **Evento de pagamento**: Parcela Contratual, VOR - 50% ou VOR - 100%.
- **Descrição da Invoice**, **Condição de pagamento** (texto livre).
- **Data Prevista de Pagamento**: data-chave — é ela que decide se o valor
  vai para "A Vencer" ou "Vencido" quando o Status for Aprovado.
- **Valor (R$)**.
- **Status**: Previsto, Em Discussão, Aprovado, PO Não Emitida ou PO Sem
  Saldo. É esse campo (não o "Status da Medição") que decide em qual card
  do Consolidado o valor aparece.
- **Status da Medição**: Aprovada, Em Discussão ou Prevista — só
  informativo, não influencia nenhum cálculo financeiro.
- **PO emitida**: sim/não.

### Bloco 3 — Informações de Faturamento

Mesma lógica de tabela + Adicionar/Editar do Bloco 2. Clique em **+
Adicionar faturamento** para lançar um novo faturamento, ou **Editar** numa
linha existente.

Ao adicionar, você marca **uma ou mais parcelas** (checklist mostrando
Evento — Descrição — Valor). Se marcar mais de uma, o sistema cria um
lançamento de faturamento para cada parcela automaticamente, todos com os
mesmos dados de Data de Faturamento, Nº/Data da Invoice etc. — você não
digita o valor faturado, ele vem do valor da própria parcela.

Campos:

- **Data de Faturamento**.
- **Nº da Invoice**, **Data da Invoice**.
- **Status**: **Pago** ou **Não pago**.
  - Se **Pago**: aparece o campo **Data Real de Pagamento** (opcional) —
    marcar Pago é o que faz o valor contar no card "Pago" do Consolidado.
  - Se **Não pago**: aparece o campo **Nova Data de Faturamento**, para
    registrar um reagendamento.

### Confirmar alteração

Ao final da tela (depois do Bloco 3), toda alteração em Bloco 1 ou 2 exige
um **motivo**. O anexo do cronograma atualizado (PDF) é opcional. Clique em
**Salvar alteração** para gravar — isso também registra tudo no histórico
do projeto. Alterações só no Bloco 3 são salvas separadamente, pelo botão
**Salvar faturamento**, sem exigir motivo nem PDF.

## 3. Atualização Termo de Aceite

Escolha um projeto na lista. A tela mostra as informações gerais (só
leitura) e a lista de OS daquele CC vindas da EAP. Para cada OS, informe a
**data de assinatura** e anexe o **PDF do termo assinado**; cada OS é salva
independentemente das outras.

## 4. Cronograma de Faturamento

Mostra, semana a semana (segunda a domingo) dentro do mês, quanto cada
projeto tem previsto de faturamento, separado em Escopo e VOR.

- Use as setas **←** / **→** para navegar entre meses.
- Use o **filtro de Cliente** para ver só um cliente.
- **Cores das células**:
  - 🟩 **verde** = já pago
  - 🟨 **amarelo** = previsto, ainda dentro do prazo
  - 🟥 **vermelho** = vencido (passou da Data Prevista de Pagamento sem
    pagamento)
- A coluna **Total a ser Faturado** soma a linha inteira e fica sempre em
  branco (não segue a cor de nenhuma semana específica).

## 5. Detalhe do Projeto (`/projetos/[id]`)

Acessado clicando no CC a partir do Consolidado. Mostra os eventos de
pagamento do projeto com Nº Invoice, Data de Faturamento, Data de
Pagamento e Status (Pago/Não pago) — tudo vindo do que foi lançado em
Configuração/Faturamento. Clique num evento para expandir a lista de OS da
EAP concluídas até a Data Prevista de Pagamento daquele evento, cada uma
com sua situação de Termo de Aceite (Sim/Não).

## Perguntas frequentes

**Por que o card "Aprovado" diminuiu depois que lancei a Data Prevista de
Pagamento de uma parcela?**
Porque, a partir daquele momento, o valor passa a contar em "A Vencer" ou
"Vencido" (dependendo da data), não mais em "Aprovado" — ele não é somado
duas vezes.

**Marquei uma parcela como aprovada, mas ela não aparece em Vencido mesmo
com a data já passada. Por quê?**
Confira o campo **Status** (não o "Status da Medição") — só parcelas com
Status = **Aprovado** entram na conta de Vencido/A Vencer.

**Como faço um valor aparecer no card "Pago"?**
Vá em Configuração → abra o projeto → Bloco 3 (Faturamento) → edite (ou
adicione) o lançamento daquela parcela → mude o Status para **Pago**.
