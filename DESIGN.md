# DESIGN — Identidade visual e componentes

> Documento oficial. Define a paleta de cores, tipografia, espaçamento e
> componentes visuais. Para o que é o produto, ver PRD.md. Para regras de
> código, ver RULES.md.

## 1. Princípios visuais

O MyLife é um produto de organização pessoal. A interface deve transmitir
calma, clareza e maturidade. Não é um app de banco, não é um app infantil,
não é um dashboard técnico. É um lugar de tranquilidade.

Quatro regras que guiam tudo:

1. Clareza acima de decoração. Se um elemento não ajuda a entender, ele
   não existe.

2. Contraste suave, nunca agressivo. O usuário vai olhar isso todo dia.

3. Movimento contido. Animações existem para orientar, não para
   impressionar.

4. Cores com função. Nenhuma cor é usada por estética. Cada cor comunica
   um estado.

## 2. Paleta de cores

A identidade visual do MyLife é composta por três famílias de cor mais
os estados semânticos.

### Base — off-white quente (canvas)

- canvas-50     #FDFCFA
- canvas-100    #F7F5F0   (fundo principal)
- canvas-200    #EFEDE7   (fundo secundário)
- canvas-300    #E5E2D9   (bordas sutis)
- canvas-400    #D9D6CB   (bordas)

Uso: fundos, cards, divisores, superfícies. É a base do produto — nada
compete com ela.

### Marca — cobalto pastel (brand)

- brand-50      #EEF2FB   (backgrounds de badge)
- brand-100     #DDE4F6
- brand-200     #BCC9EC
- brand-300     #9BAEDF
- brand-400     #7E93D9
- brand-500     #6B81CF
- brand-600     #5872C9   (cor principal)
- brand-700     #455CAB
- brand-800     #364A88
- brand-900     #283866

Uso: marca, botões primários, links, ícones ativos, acentos. Cobalto
pastel, nunca neon.

### Texto — cinza-azulado escuro (ink)

- ink-900       #1A2233   (texto principal)
- ink-700       #2E3A52
- ink-500       #5A6478   (texto secundário)
- ink-400       #8B93A5   (texto terciário)
- ink-300       #B5BCC8   (placeholders)

Uso: toda a hierarquia de texto.

### Estados semânticos

- state-success #5A9F7E   (receita, positivo)
- state-alert   #D9A85C   (pendente, atenção)
- state-error   #C97F7F   (despesa, erro)
- state-info    #5872C9   (informativo — mesmo que brand-600)

Uso: status, feedback, indicadores. Nunca decorativo.

### Regras de uso

- Uma cor principal por tela (cobalto ou canvas)
- Cores de estado aparecem só quando há estado real
- Nunca usar hex direto — sempre via token do Tailwind
- Nunca misturar paletas (nada de red-500, yellow-500 do Tailwind puro)

## 3. Tipografia

Duas famílias. Sora para display e títulos. Inter para corpo e números.

### Sora (display)

Pesos: 500, 600, 700
Uso: logo, títulos de página, cabeçalhos de seção, números grandes de KPI

### Inter (corpo)

Pesos: 400, 500, 600
Uso: parágrafos, labels, botões, inputs, tabelas, tudo mais

### Escala

- display   48px / lh 56 / tracking -0.02em   → Sora 600
- h1        32px / lh 40 / tracking -0.02em   → Sora 600
- h2        24px / lh 32 / tracking -0.01em   → Sora 600
- h3        18px / lh 24 / tracking  0        → Sora 500
- body      16px / lh 24                       → Inter 400
- small     14px / lh 20                       → Inter 400
- caption   12px / lh 16 / tracking  0.02em    → Inter 500

### Regras

- Números financeiros sempre com `tabular-nums`
- Labels em uppercase com tracking
- Nunca negrito decorativo (só semântico)
- Nunca mais de 2 pesos na mesma hierarquia visual

## 4. Espaçamento e layout

### Grid

- Container máximo: 1400px
- Sidebar fixa: 240px
- Padding de conteúdo: 24px (desktop), 16px (mobile)
- Gap entre cards: 16px (compacto), 24px (seções)

### Raio de borda

- Padrão: 10px
- lg: 16px
- xl: 18px
- 2xl: 24px
- Full: 999px (badges, avatares)

### Sombras

- card:     0 1px 3px rgba(26,34,51,.06), 0 4px 12px rgba(26,34,51,.04)
- card-lg:  0 8px 32px rgba(26,34,51,.08)
- glow:     0 0 40px rgba(88,114,201,.15)

Nunca mais de 3 níveis de elevação por tela.

### Animações

Definidas em `tailwind.config.ts`:

- `animate-slide-up` — 0.25s cubic-bezier(.4,0,.2,1) — entradas de card/modal
- `animate-fade-in` — 0.2s ease — aparições simples (ex.: menus)

## 5. Componentes oficiais

Os componentes abaixo são os autorizados no design system. Novos
componentes entram só com autorização.

### Botões

- `.btn-primary` — ação principal. Fundo cobalto, texto branco. Um por
  tela/seção.
- `.btn-ghost` — ação secundária. Fundo branco, borda canvas, texto ink.
- Botões destrutivos usam classes utilitárias (`bg-state-error`,
  `text-state-error`), sem classe dedicada no design system.

### Inputs

- `.input-base` — campo padrão. Fundo branco, borda canvas-300, foco com
  borda brand e ring suave.
- `.label-base` — label acima do campo. Uppercase, ink-500, small.

### Cards

- `.card` — container de conteúdo. Fundo branco, borda canvas-300, raio
  lg, sombra card.
- `.card-hover` — variante com transição de borda no hover.

### KPI

- `.kpi-label` — label pequeno acima do valor. Uppercase, ink-500.
- Valor usa `font-display` e `text-xl`/`text-h3`, com cor de estado
  quando aplicável.

### Ícones e botões de ação

- `.icon-button` — botão quadrado 36x36 com ícone. Fundo branco, borda
  canvas, hover brand.

### Badges

- Componente `<Badge variant="..." />`
- Variantes implementadas: `brand`, `success`, `neutral` (default `neutral`)
- `warning` e `danger` estão planejadas, mas ainda não existem no
  componente

### Modal e diálogos

- Componente `<Modal />` — overlay + container centralizado. Implementa:
  - Fechar com ESC
  - Focus trap (Tab/Shift+Tab presos no modal)
  - Fechar ao clicar no overlay
  - Foco devolvido ao elemento anterior ao fechar
  - `role="dialog"` e `aria-modal="true"`
- Componente `<ConfirmDialog />` — atalho para confirmação de ação,
  construído em cima do `<Modal />`. Suporta variante `danger`.

### Estados vazios

- Componente `<EmptyState />` — ícone Lucide (`Inbox`), título,
  descrição opcional e CTA opcional.

## 6. Padrões visuais

### Status de transação

- Pendente: cor state-alert, fundo state-alert/15
- Concluída: cor state-success, fundo state-success/15

### Status de família

- Ativa: cor brand-600, fundo brand-50, borda brand-300

### Status de categoria

- Receita: cor state-success, fundo state-success/15
- Despesa: cor state-error, fundo state-error/15

### Números financeiros

- Receita: prefixo `+`, cor state-success
- Despesa: prefixo `−`, cor state-error
- Neutro: cor ink-900
- Sempre com `.tabular-nums`

### Gráficos

- Cores primárias: brand-600, brand-400, state-success, state-alert,
  state-error
- Grid e eixos: canvas-300
- Fundo do gráfico: transparente
- Tooltip: fundo branco, borda canvas-300, texto ink-900

## 7. Acessibilidade

- Todo texto sobre fundo claro precisa ter contraste mínimo AA
- Nunca usar cor sozinha para transmitir informação (sempre acompanhar
  com ícone, texto ou forma)
- Foco visível em todos os elementos interativos
- Botões desabilitados com opacidade reduzida e cursor bloqueado
- Modal e diálogos precisam ter `role="dialog"` e `aria-modal="true"`
  (já implementado no `<Modal />`)

## 8. Identidade do produto

- Marca: MyLife (com "My" em ink-900 e "Life" em brand-600)
- Símbolo: "M" orgânico em cobalto pastel, salvo como PNG de alta
  resolução em `public/mylife-symbol.png`
- Favicon: usa o mesmo símbolo (`/mylife-symbol.png`)
- Theme color (PWA/browser): `#F7F5F0` (canvas-100)
- Tagline: "Sua vida organizada" (usada no cabeçalho da Sidebar)

## 9. Documentos relacionados

- PRD.md — o que é o produto
- ARCHITECTURE.md — como o produto é montado
- RULES.md — o que pode e o que não pode ser feito
- TASK.md — o que está sendo feito agora
- MEMORY.md — decisões, erros e mudanças de rumo
- tailwind.config.ts — implementação dos tokens
- src/styles/globals.css — classes utilitárias
