# MyLife

Suíte pessoal de organização de vida, construída em módulos. O módulo
Financeiro é o módulo oficial ativo. A Lista de Mercado existe em código
como módulo experimental.

## Documentação

Antes de qualquer coisa, leia os documentos oficiais na raiz:

- PRD.md             — o que é o produto, para quem, o que NÃO é
- ARCHITECTURE.md    — como o produto é montado
- RULES.md           — o que pode e o que não pode ser feito
- DESIGN.md          — identidade visual e componentes
- TASK.md            — o que está sendo feito agora
- MEMORY.md          — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
- CONTEXT.md         — arquivo legado (não usar como fonte de verdade)

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (paleta off-white com cobalto pastel)
- Supabase (Auth + Postgres + RLS)
- TanStack Query
- React Router v6
- React Hook Form + Zod
- Recharts
- Lucide React
- Sonner
- Zustand (presente em dependencies, sem uso direto identificado)

## Módulos

Módulo oficial ativo:

- **Financeiro** (`/financeiro`) — livro-caixa com dashboard, categorias,
  transações, parcelamento e import/export CSV

Módulo experimental (fora do escopo oficial):

- **Lista de Mercado** (`/lista-mercado`) — itens por household. Existe
  em código, mas não é considerado módulo oficial.

Home autenticada (rota `/`):

- Exibe um resumo semanal do tempo de uso da plataforma, medido
  localmente por usuário neste dispositivo.

Módulos futuros (registrados como comentário em `src/app/modules.ts`):

- Rotina
- Estudos
- Saúde

## Pré-requisitos

- Node.js 22+ (o `.nvmrc` fixa 22; as versões recentes de
  `@supabase/supabase-js` exigem ≥ 22)
- Conta no Supabase

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:

   Copie `.env.example` para `.env.local` e preencha com os valores do
   seu projeto Supabase (Settings → API):

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME` (opcional)

3. Configure o banco:

   No Supabase, abra SQL Editor → cole o conteúdo de
   `supabase/schema.sql` → Run.

   Para atualizar um banco já configurado, aplique também, nesta ordem,
   `supabase/permissoes-household.sql` e
   `supabase/remover-membro-household.sql`. O usuário pode usar o espaço
   pessoal sem entrar em uma família; em famílias, owner/admin gerenciam
   membros, membro tem leitura/escrita e visualizador tem somente leitura.

4. Rode o projeto:

   ```bash
   npm run dev
   ```

   Acesse http://localhost:5173

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run preview` — pré-visualiza o build
- `npm run typecheck` — checa tipos sem gerar arquivos
- `npm run lint` — roda ESLint (`.ts,.tsx`)

## Deploy no Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- SPA redirect e headers de segurança (`X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) já
  configurados em `netlify.toml`.

## Segurança

- Credenciais vivem só em `.env.local` (não versionado)
- Somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` vão para o frontend
- `SERVICE_ROLE_KEY` nunca aparece no projeto (ignora RLS)
- Isolamento por household garantido no Postgres via RLS e função
  `is_household_member(household_id)`
