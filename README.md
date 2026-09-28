# MyLife

Suíte pessoal de organização de vida. O módulo Financeiro é o primeiro.

## Documentação

Antes de qualquer coisa, leia os documentos oficiais na raiz:

- PRD.md            — o que é o produto, para quem, o que NÃO é
- ARCHITECTURE.md   — como o produto é montado
- RULES.md          — o que pode e o que não pode ser feito
- DESIGN.md         — identidade visual e componentes
- TASK.md           — o que está sendo feito agora
- MEMORY.md         — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (paleta off-white com cobalto pastel)
- Supabase (Auth + Postgres + RLS)
- TanStack Query
- React Router v6
- React Hook Form + Zod
- Recharts

## Pré-requisitos

- Node.js 22+ (o Supabase 2.117.1 exige)
- Conta no Supabase

## Rodando localmente

1. Instale as dependências:

   npm install

2. Configure as variáveis de ambiente:

   Copie .env.example para .env.local e preencha com os valores do
   seu projeto Supabase (Settings → API):

   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

3. Configure o banco:

   No Supabase, abra SQL Editor → cole o conteúdo de supabase/schema.sql
   → Run.

4. Rode o projeto:

   npm run dev

   Acesse http://localhost:5173

## Scripts

- npm run dev         — desenvolvimento
- npm run build       — build de produção
- npm run preview     — pré-visualiza o build
- npm run typecheck   — checa tipos sem gerar arquivos
- npm run lint        — roda ESLint

## Deploy no Netlify

- Build command: npm run build
- Publish directory: dist
- Environment variables: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

O arquivo netlify.toml já configura tudo isso.

## Segurança

- Credenciais vivem só em .env.local (não versionado)
- Somente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY vão para o frontend
- SERVICE_ROLE_KEY nunca aparece no projeto (ignora RLS)
- Isolamento por household garantido no Postgres via RLS