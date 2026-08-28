# Controle de Obras — Estaleiro Mauá

Sistema de **Controle de Projetos, Pagamentos e Faturamento** do Estaleiro
Mauá.

## O que é este sistema?

É uma ferramenta interna para acompanhar, projeto por projeto (identificado
pelo Centro de Custo, o "CC"), toda a vida financeira de um contrato: o que
foi combinado para receber, o que já foi aprovado, o que já foi faturado, o
que já foi pago e o que ainda está para vencer ou já venceu.

Antes desse sistema, essas informações ficavam espalhadas em planilhas.
Aqui elas ficam centralizadas, com histórico de quem alterou o quê e
quando, e com um painel único que mostra a situação de todos os projetos
de uma vez.

## Para quem é

Para quem acompanha o financeiro dos projetos do estaleiro: coordenadores
de projeto, equipe administrativa/financeira e gestão. Cada pessoa que usa
o sistema tem um dos três níveis de acesso:

- **Administrador** e **Gestor** — podem cadastrar projetos, lançar
  pagamentos e faturamentos, e editar tudo.
- **Visualizador** — só consegue consultar as informações, sem alterar
  nada. Ideal para quem só precisa acompanhar os números.

## O que o sistema faz, na prática

- **Consolidado de Projetos** — uma tela única que mostra, para todos os
  projetos (ou filtrado por um cliente específico), quanto está Aprovado,
  Em Discussão, Previsto, Pago, A Vencer e Vencido. É o retrato financeiro
  geral, atualizado em tempo real.
- **Cadastro de Projetos** — para cada CC, guarda as informações gerais do
  contrato (cliente, embarcação, coordenador, datas) e a lista de parcelas
  de pagamento combinadas, com valor, status e a data em que se espera
  receber cada uma.
- **Lançamento de Faturamento** — quando uma invoice é emitida contra uma
  ou mais parcelas, o lançamento é feito aqui, junto com a informação de
  se aquele faturamento já foi pago ou ainda não.
- **Termo de Aceite por OS** — para cada Ordem de Serviço do projeto,
  registra a data de assinatura do termo de aceite e guarda o PDF
  assinado.
- **Cronograma de Faturamento** — um calendário semanal que mostra, mês a
  mês, quanto se espera faturar de cada projeto, já sinalizado por cor:
  verde (já pago), amarelo (ainda dentro do prazo) e vermelho (vencido).
- **Histórico de alterações** — toda mudança relevante no cadastro de um
  projeto pede um motivo e fica registrada, com data, autor e — quando
  aplicável — o cronograma em PDF que justificou a mudança. Nada se perde
  nem fica sem explicação.

## Documentação

- 📘 **[Guia de Uso](./GUIA_DO_USUARIO.md)** — passo a passo de cada tela,
  em linguagem simples, para quem vai usar o sistema no dia a dia.
- 📄 **[Documentação Técnica](./DOCUMENTACAO.md)** — como o sistema é
  construído por dentro, para quem for dar manutenção ou evoluir o código.
- ⚙️ **[Guia de Configuração do Ambiente](./SETUP.md)** — passos para
  colocar o sistema no ar (contas de nuvem necessárias).
- 🎨 **[Design System](./DESIGN_SYSTEM.md)** — padrão visual (cores,
  espaçamentos, componentes) usado em todas as telas.

## Suporte

Dúvidas sobre como usar o sistema no dia a dia: consulte primeiro o
[Guia de Uso](./GUIA_DO_USUARIO.md), que tem uma seção de perguntas
frequentes sobre os pontos que mais geram dúvida (por exemplo, por que um
valor aparece ou não em "Vencido").
