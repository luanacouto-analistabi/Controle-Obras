# Design System — Metas Mauá 2026

Documento de referência visual da aplicação `metas-maua` (dashboard "Metas 2026" do
Estaleiro Mauá). Reflete o que está implementado em `app/globals.css`, `lib/utils.ts`
e `components/ui/`.

## Stack de UI

- **Next.js (App Router)** com Server/Client Components
- **Tailwind CSS v4** — tokens definidos via `@theme` em `app/globals.css`
- **`@base-ui/react`** — primitives não estilizados (Button, Input, Select, Dialog, Sheet etc.)
- **`class-variance-authority` (cva)** — variantes de componentes (Button, Badge)
- **`clsx` + `tailwind-merge`** via helper `cn()` (`lib/utils.ts`) — garante que classes
  passadas por prop sobrescrevam corretamente as classes padrão do componente
- **`lucide-react`** — ícones
- **Fonte**: Inter (via `next/font/google`), aplicada globalmente (`font-sans`)

## Cores

### Primitivos de marca (`app/globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `--color-maua-navy` | `#364B59` | Cor primária — sidebar, títulos, botões/headers |
| `--color-maua-orange` | `#F18213` | Cor de destaque — CTAs, badges ativos, anel de foco |
| `--color-maua-white` | `#FFFFFF` | Fundo de cards |
| `--color-maua-gray-50` | `#E7EAEE` | Fundo das páginas (`bg-surface`) |
| `--color-maua-gray-100` | `#F1F3F5` | Secundário / hover sutil |
| `--color-maua-gray-200` | `#E2E8F0` | Bordas (`--color-border`) |
| `--color-maua-gray-400` | `#94A3B8` | Texto secundário em fundo escuro |
| `--color-maua-gray-500` | `#6B7280` | `muted-foreground` |
| `--color-maua-gray-700` | `#374151` | — |
| `--color-maua-gray-900` | `#111827` | Texto principal (`--color-text`) |

### Tokens semânticos

- `--color-primary` = navy (`#364B59`) · `--color-accent` = orange (`#F18213`)
- `--color-background` = branco · `--color-surface` = gray-50 (`#E7EAEE`, fundo das páginas autenticadas)
- `--color-border` = gray-200 · `--color-text` = gray-900
- `--ring` (anel de foco padrão dos inputs/selects/botões) = `#F18213` (laranja)

### Gamificação de progresso (3 faixas)

| Faixa | Cor | Variável |
|---|---|---|
| 0–32% (baixo) | `#DFA1AA` (vermelho) | `--color-goal-low` |
| 33–65% (médio) | `#F9E79F` (amarelo) | `--color-goal-mid` |
| 66–100% (alto) | `#9AD595` (verde) | `--color-goal-high` |

Helpers em `lib/utils.ts`:
- `goalColor(pct)` → retorna a cor CSS acima (para `style={{ backgroundColor }}` em barras de progresso)
- `goalTextClass(pct)` → retorna classes Tailwind de texto+fundo para badges (`text-[#1B5E37] bg-[#9AD595]`, `text-[#7B5800] bg-[#F9E79F]`, `text-[#7C2737] bg-[#DFA1AA]`)

### Status de "Avaliação Técnica" (tabelas executivas)

| Status | Condição | Classes |
|---|---|---|
| PENDENTE | sem lançamento | `bg-slate-100 text-slate-500` |
| EM CONFORMIDADE | pct ≥ 90% | `bg-emerald-50 text-emerald-700` |
| EM ANDAMENTO | pct ≥ 60% | `bg-orange-50 text-[#F18213]` |
| EM RISCO | pct < 60% | `bg-red-50 text-red-600` |

### Sidebar (tema escuro)

- Fundo: `#364B59` (navy) · Hover / sub-seção: `#2D3F4A`
- Item ativo: fundo `#F18213`, texto branco
- Texto inativo: `#C8D5DC` · Labels secundários: `#94A3B8`

## Tipografia

- Fonte única: **Inter**, aplicada via `html` (`font-sans`)
- Hierarquia comum observada nas páginas:
  - **Título de página**: `text-2xl font-bold text-[#364B59]`
  - **Header de seção/tabela** ("header bar"): `text-base font-semibold text-[#364B59]` (com ícone)
  - **Cabeçalho de coluna de tabela**: `text-[10px] font-bold uppercase tracking-wider text-[#364B59]/70`
    (ou `text-slate-300` em tabelas com fundo escuro `#2D3F4A`)
  - **Texto padrão**: `text-sm`
  - **Texto auxiliar/legendas**: `text-xs text-muted-foreground`
  - **Microtexto** (badges, chips, rótulos de eixo): `text-[9px]` a `text-[11px]`

## Espaçamento, raio e sombra

- Raio padrão: `--radius-sm 0.25rem` · `--radius-md 0.5rem` · `--radius-lg 0.75rem` · `--radius-xl 1rem`
- Cards: `rounded-xl border border-border bg-white shadow-sm`
- Fundo geral das páginas autenticadas: `bg-surface` (`#E7EAEE`)
- Sombra de card: `--shadow-card` / `--shadow-elevated`

## Padrões visuais reutilizados

### "Header bar" de seção (com ícone)

Usado em tabelas, organograma e planos de ação:

```tsx
<div className="px-6 py-3 bg-[#364B59]/20">
  <h3 className="flex items-center gap-2 text-base font-semibold text-[#364B59]">
    <ClipboardList className="w-5 h-5" aria-hidden />
    Título da seção
  </h3>
</div>
```

Cabeçalhos de `<TableRow>` (admin/goals, users, audit, reports) também usam
`bg-[#364B59]/20` como fundo.

### Badges de status / período

Pill arredondado: `text-[10px] font-bold uppercase px-2.5 py-1 rounded-full {bg} {text}`.
A cor vem de `goalTextClass(pct)`/`goalColor(pct)` (gamificação) ou de mapas fixos
(`statusInfo`, `ACTION_STYLE` para INSERT/UPDATE/DELETE na auditoria).

### Botão de ação primário (laranja)

```tsx
className="text-xs font-bold bg-[#F18213] hover:bg-[#D9730D] text-white px-4 py-2 rounded-lg transition-colors"
```

### Botão primário navy

```tsx
className="bg-[#364B59] hover:bg-[#2D3F4A] text-white text-sm"
```

### Inputs e Selects de filtro

- `h-8 text-sm bg-white` aplicado sobre os componentes base `Input`/`SelectTrigger`
  (que por padrão têm `bg-transparent`); `cn()` (twMerge) garante que `bg-white`
  sobrescreva o fundo padrão sem conflito.
- Foco: anel laranja herdado do componente base
  (`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`,
  com `--ring: #F18213`).

### Cards do organograma (`OrgNode` / `SubDeptCard`)

- `rounded-xl border bg-white p-2.5–3.5 shadow-sm`, hover `hover:shadow-md hover:-translate-y-0.5`
- Selecionado: `ring-2 ring-[#F18213] ring-offset-2`
- Ícone circular: `bg-[#364B59]/30` com ícone `text-[#364B59]/60`
- Barra de progresso: `h-1–1.5 rounded-full bg-gray-100`, preenchimento com
  `style={{ backgroundColor: goalColor(pct) }}`

## Componentes base (`components/ui/`)

Construídos sobre `@base-ui/react` + `cva` + `cn()`:

- **Button** — variantes `default` (navy), `outline`, `secondary`, `ghost`,
  `destructive`, `link`; tamanhos `xs`, `sm`, `default`, `lg`, `icon`/`icon-sm`/`icon-lg`
- **Input** — `h-8 rounded-lg border border-input bg-transparent`, anel de foco laranja
- **Select** (`SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`) —
  `bg-transparent border border-input`
- **Badge** — variantes `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`
- **Table** (`TableHeader`, `TableRow`, `TableHead`, `TableCell`)
- **Dialog** — modal centralizado `rounded-xl bg-popover ring-1 ring-foreground/10`
- Demais: `Avatar`, `Sheet`, `DropdownMenu`, `Tooltip`, `ProgressRing`, `Sidebar`,
  `Form`, `Label`, `Textarea`, `Separator`, `Skeleton`

## Ícones

- Biblioteca: `lucide-react` (`Target`, `ClipboardList`, `Users2`, `ChevronRight`,
  `Pencil`, `Trash2`, `Network` etc.)
- Tamanho padrão: `w-4 h-4` ou `w-5 h-5`, sempre com `aria-hidden`
- A sidebar usa SVGs inline customizados (stroke-based, `w-5 h-5`, `strokeWidth={1.8}`)

## Utilitários (`lib/utils.ts`)

- `cn(...)` — `twMerge(clsx(...))`
- `goalColor(pct)` / `goalTextClass(pct)` — cor de gamificação (vermelho/amarelo/verde)
- `calcProgress(current, target, operator?)` — % de atingimento, considerando o
  operador da meta (`>=` vs `<=`/`<`)
- `OP_SYMBOL` — mapeia operador (`>=`, `<=`, `>`, `<`, `=`) para símbolo (`≥`, `≤`, `>`, `<`, `=`)
- `formatGoalValue(value, unit)` — formata valor conforme unidade (`R$`, `%`, outras)
- `labelFromOptions(value, options, fallback)` — resolve o rótulo exibido em Selects
  a partir do id selecionado

## Impressão (PDF)

Estilos dedicados em `@media print` (`app/globals.css`):
- Página A4 paisagem
- Oculta `aside` e elementos `.no-print`
- Cabeçalho/rodapé fixos via `.print-page-header` / `.print-page-footer`
- Regras e títulos em navy `#364B59` (`.print-rule`, `.print-system-name`)
