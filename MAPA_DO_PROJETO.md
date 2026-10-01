# Mapa do Projeto — MyLife

> Documento de trabalho. Levantamento factual do estado atual do projeto.
> Não contém sugestões de correção. Serve como base para priorização e
> para a escrita dos documentos oficiais (PRD, ARCHITECTURE, RULES,
> DESIGN, TASK, MEMORY).
>
> Última atualização: 2026-10-01

## 1. Visão geral

- Produto: MyLife — suíte pessoal de organização de vida
- Módulo oficial ativo: Financeiro
- Módulo experimental (não oficial): Lista de Mercado
- Home autenticada: resumo semanal do tempo de uso da plataforma
- Stack: Vite + React 18 + TypeScript + Tailwind + Supabase +
  TanStack Query + React Router v6
- Backend: Supabase (Auth + Postgres + RLS)
- Deploy alvo: Netlify

## 2. Estrutura de pastas (estado atual)

- `src/`
  - `app/`
    - `AppShell.tsx`
    - `HomePage.tsx`
    - `Sidebar.tsx`
    - `Topbar.tsx`
    - `modules.ts`
  - `core/`
    - `activity/`
      - `usePlatformTime.ts`
    - `auth/`
      - `AuthProvider.tsx`
      - `ProtectedRoute.tsx`
      - `auth.service.ts`
      - `types.ts`
      - `useAuth.ts`
      - `pages/`
        - `CadastroPage.tsx`
        - `LoginPage.tsx`
        - `RecuperarSenhaPage.tsx`
        - `RedefinirSenhaPage.tsx`
    - `household/`
      - `permissoes.ts`
      - `HouseholdGuard.tsx`
      - `HouseholdProvider.tsx`
      - `household.service.ts`
      - `convites.service.ts`
      - `convites.types.ts`
      - `types.ts`
      - `useHousehold.ts`
      - `components/`
        - `FamilyInviteForm.tsx`
        - `FamilyInvitesList.tsx`
        - `FamilyMembersList.tsx`
        - `GerenciarFamiliaPanel.tsx`
      - `hooks/`
        - `useConvites.ts`
        - `useMembros.ts`
      - `pages/`
        - `AceitarConvitePage.tsx`
        - `OnboardingPage.tsx`
        - `SelecionarHouseholdPage.tsx`
    - `usuarios/`
      - `usePerfil.ts` (stub — retorna `null`)
      - `pages/`
        - `PerfilPage.tsx`
  - `modules/`
    - `financeiro/`
      - `pages/`
        - `DashboardPage.tsx`
      - `components/`
        - `CategoriasManager.tsx`
        - `LancamentoForm.tsx`
      - `hooks/`
        - `useCategorias.ts`
        - `useContas.ts`
        - `useResponsaveis.ts`
        - `useTransacoes.ts`
      - `services/`
        - `categorias.service.ts`
        - `contas.service.ts`
        - `responsaveis.service.ts`
        - `transacoes.service.ts`
      - `types/`
        - `categorias.types.ts`
        - `contas.types.ts`
        - `responsaveis.types.ts`
        - `transacoes.types.ts`
      - `utils/`
        - `seedCategorias.ts`
        - `seedResponsaveis.ts`
    - `lista-mercado/` (experimental)
      - `pages/`
        - `ListaMercadoPage.tsx`
  - `components/`
    - `ui/`
      - `Badge.tsx`
      - `ConfirmDialog.tsx`
      - `EmptyState.tsx`
      - `Modal.tsx`
  - `lib/`
    - `env.ts`
    - `queryClient.ts`
    - `supabase.ts`
  - `styles/`
    - `globals.css`
  - `App.tsx`
  - `main.tsx`
  - `router.tsx`

## 3. Configuração (arquivos de raiz)

| Arquivo | Estado |
|---|---|
| `package.json` | Deps com `^` (sem lock exato). Scripts incluem `typecheck` e `lint`. |
| `package-lock.json` | Resolve versões reais (Supabase, React Query, etc.) |
| `.nvmrc` | 22 (alinhado com Supabase JS atual) |
| `tailwind.config.ts` | Paleta canvas/brand/ink/state, fontes Sora + Inter, animações `slide-up` e `fade-in` |
| `postcss.config.js` | `tailwindcss` + `autoprefixer` |
| `vite.config.ts` | Alias `@` → `./src`, porta 5173, outDir `dist`, target `es2020` |
| `tsconfig.json` | strict, `paths @/*`, lib ES2020 + DOM |
| `tsconfig.node.json` | Composite para `vite.config.ts` e `tailwind.config.ts` |
| `netlify.toml` | SPA redirect + headers de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) |
| `index.html` | Favicon PNG em `/mylife-symbol.png`, `theme-color` `#F7F5F0`, fontes Sora + Inter via Google Fonts |
| `.env.example` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_NAME` (opcional) |
| `.editorconfig` | LF, espaços, 2 espaços, trim trailing (exceto `.md` e yml) |
| `.gitattributes` | LF por padrão, binários explícitos (`*.png`, `*.jpg`, etc.) |
| `.gitignore` | node_modules, dist, `.env*`, editor, Netlify |
| `CONTEXT.md` | Legado — mantido como referência histórica com aviso no topo |
| `supabase/schema.sql` | Fonte de verdade do banco |

## 4. Rotas

### Públicas
- `/login`
- `/cadastro`
- `/recuperar-senha`
- `/redefinir-senha`
- `/aceitar-convite`

### Protegidas (auth)
- `/onboarding`
- `/selecionar-familia`

### Protegidas (auth + household, dentro do AppShell)
- `/` (index) → HomePage
- `/financeiro` → DashboardPage
- `/lista-mercado` → ListaMercadoPage (experimental)
- `/perfil` → PerfilPage

### Fallback
- `*` → redireciona para `/`

## 5. Cadeia de providers

- `main.tsx`
  - `QueryClientProvider`
    - `App.tsx`
      - `AuthProvider`
        - `HouseholdProvider`
          - `RouterProvider`

Detalhes:

- `AuthProvider` escuta `onAuthStateChange` do Supabase
- `HouseholdProvider` espera `authLoading` terminar, depois chama
  `refreshHouseholds`
- Nenhum dos dois bloqueia a renderização fora do `loading`
- `Toaster` do Sonner é montado em `main.tsx` (posição `bottom-right`,
  tema `light`, estilo inline com tokens da paleta)

## 6. Fluxos principais

### Cadastro
`/cadastro` → `cadastrarUsuario` → `signUp`. Em seguida tenta
`loginUsuario` para autenticar automaticamente. Se funcionar, o
`AuthProvider` detecta via `onAuthStateChange` e a página redireciona
para o destino (`?redirect=` ou `/`). Se o email exigir confirmação,
navega para `/login` com toast informativo e preserva `redirect`.

### Login
`/login` → `loginUsuario`. Destino: `?redirect=` > `location.state.from`
> `/`.

### Recuperação de senha
`/recuperar-senha` → `enviarEmailRecuperacao` → mostra card de
confirmação na própria página (não redireciona).

### Redefinição de senha
`/redefinir-senha?code=xxx` (ou `#code=xxx`) → `exchangeCodeForSession`
→ form → `atualizarSenha` → navega para `/`.

### Criação de família
`/onboarding` → `createHousehold`:
1. `garantirPerfil` do usuário
2. Insert em `households`
3. Insert em `household_membros` como `owner`
4. Seed de categorias (`buildSeedCategorias`)
5. Seed de responsáveis (`buildSeedResponsaveis`)

Rollback em caso de falha nos seeds. Navega para `/`.

### Exclusão de família
`/selecionar-familia` → `deleteHousehold`. Service envia delete com
filtros `id` + `created_by = userId`. Policy `households_delete` exige
`papel = 'owner'`. A página só mostra o botão de exclusão se
`household.membership.papel === 'owner'` e a família **não** for pessoal.
Provider recarrega a lista e `aplicarHouseholds` atualiza o ativo.

### Convites
`/selecionar-familia` → botão "Gerenciar" → `GerenciarFamiliaPanel`:
- `FamilyInviteForm` cria convite → token UUID → link
  `${origin}/aceitar-convite?token=...` copiado para o clipboard
- `FamilyInvitesList` lista pendentes com botão "Copiar link" e
  "Cancelar"
- `FamilyMembersList` mostra membros ativos com papel

Aceite: `/aceitar-convite?token=...` → `AceitarConvitePage` valida
token + status + email. Chama RPC `aceitar_convite` ou wrapper
`recusarConvite` (que usa `cancelar_convite`). Após aceitar, chama
`refreshHouseholds`, `setActiveHousehold` e navega para `/` em 1,5s.

Regra de RLS: `household_convites` bloqueia `update`/`delete` diretos —
toda mutação é via RPC.

### Lançamento simples
`DashboardPage` → `LancamentoForm` → `criarTransacao` → insert em
`transacoes` com `tipo_no_cartao = null` (não-cartão) ou `'avista'`
(cartão à vista).

### Lançamento parcelado
`LancamentoForm` com tipo `cartao` e `parcela_total > 1` →
`criarTransacao`:
1. Insert em `parcelamentos` (`valor_total`, `valor_parcela`,
   `total_parcelas`, `data_primeira_parcela`)
2. Gera N linhas em `transacoes` (uma por mês via `addMonths` a partir
   da data da primeira parcela)
3. Cada linha tem `parcelamento_id`, `parcela_atual`,
   `parcela_total`, `tipo_no_cartao = 'parcelado'`, valor por parcela

### Import/Export CSV
Ambos dentro de `DashboardPage`:
- Import: espera colunas `Data, Descrição, Valor` (mínimo 3 colunas).
  Usa a primeira categoria de despesa existente, tipo `variavel`, forma
  `pix`, status `concluida`, observação `Importado via CSV`.
- Export: cabeçalho `Data, Descrição, Categoria, Tipo, Forma de
  pagamento, Instituição, Responsável, Parcela, Valor`.

### Edição de perfil
`/perfil` → `PerfilPage` → `update` direto em `perfis` (exceção
documentada). Email não é editável.

## 7. Modelo de dados (Supabase)

### Tabelas
- `perfis`
- `households`
- `household_membros`
- `categorias`
- `contas`
- `responsaveis`
- `parcelamentos`
- `transacoes`
- `household_convites`
- `lista_mercado_itens` (experimental)

### Funções e triggers
- `set_updated_at()` — trigger em todas as tabelas com `updated_at`
- `handle_new_user()` — trigger em `auth.users` (cria perfil, household
  pessoal `<PrimeiroNome> (pessoal)` e membership owner)
- `is_household_member(uuid)` — usada nas policies de RLS
- `aceitar_convite(uuid)` — RPC de aceite
- `cancelar_convite(uuid)` — RPC de cancelamento (usada também para
  recusar)

### RLS
- Todas as tabelas de negócio têm policy baseada em
  `is_household_member(household_id)`
- `households_delete` exige `papel = 'owner'`
- Papéis: owner/admin gerenciam membros; membro lê/escreve; visualizador somente lê
- Espaço pessoal é isolado por `household_id` e não aceita convites
- Owner/admin podem alterar papel ou remover membros
- Atualizações SQL: `permissoes-household.sql` e `remover-membro-household.sql`
- `household_convites` bloqueia `update` e `delete` diretos (`using false`)
- `perfis_select` permite ver o próprio perfil ou perfis de membros do
  mesmo household
- `membros_insert` permite insert se for o próprio usuário, ou por
  `owner`/`admin`
- `is_household_member` é `security definer`

### Grants
- `usage on schema public` para `anon` e `authenticated`
- `select, insert, update, delete` em todas as tabelas para `authenticated`
- `execute` para `is_household_member`, `aceitar_convite` e
  `cancelar_convite`

## 8. Estado da paleta visual

### Migrado para off-white / cobalto (estado atual)

- `tailwind.config.ts`, `globals.css`
- `AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- `LoginPage.tsx`, `CadastroPage.tsx`, `RecuperarSenhaPage.tsx`,
  `RedefinirSenhaPage.tsx`
- `PerfilPage.tsx`
- `OnboardingPage.tsx`, `SelecionarHouseholdPage.tsx`,
  `AceitarConvitePage.tsx`
- `main.tsx` (Toaster com `theme="light"` e tokens da paleta)
- `ProtectedRoute.tsx`, `HouseholdGuard.tsx` (spinners na paleta nova)
- `HomePage.tsx` (Recharts + textos)
- `DashboardPage.tsx` (Recharts + classes)
- `CategoriasManager.tsx`, `LancamentoForm.tsx`
- `Modal.tsx`, `ConfirmDialog.tsx`, `EmptyState.tsx`, `Badge.tsx`
- `FamilyInviteForm.tsx`, `FamilyInvitesList.tsx`,
  `FamilyMembersList.tsx`, `GerenciarFamiliaPanel.tsx`

Nenhum arquivo identificado ainda com tokens da paleta antiga
(`navy-*`, `content-*`, `brand-400` como texto, `text-h4`).

### Pendências de paleta (se aparecerem)
- Substituir qualquer hex hardcoded em gráficos (`chartColor()` do
  `DashboardPage`, cores do Recharts na `HomePage`) por tokens da
  paleta oficial, se forem encontrados.

## 9. Componentes duplicados / funções sobrepostas

Nenhuma duplicação crítica identificada no estado atual.

Pontos resolvidos desde o levantamento anterior (2026-09-28):
- `CategoriasPage` e `CategoriaForm`/`CategoriaItem`/`CategoriaList`
  foram removidos. Existe só o `CategoriasManager` (usado via `Modal`
  no `DashboardPage`).
- `Modal` agora tem focus trap, ESC e fechamento por overlay.
- `ConfirmDialog` não duplica mais a `description`.
- `EmptyState` usa ícone Lucide.

Pontos ainda em aberto:
- `createHousehold` no service ainda tem alias `criarHousehold` (wrapper
  redundante, sem uso).
- `atualizarStatusTransacao` exposto no service mas não consumido por
  nenhum hook.
- `criarTransacao`/`criarLancamento`: no service atual só existe
  `criarTransacao`; o alias antigo não existe mais.
- `usePerfil.ts` em `core/usuarios/` é um stub (`return null`), sem uso.

## 10. Padrões internos

### Acesso ao Supabase
- Services usam `supabase` de `@/lib/supabase`
- Exceções (acesso direto fora de services):
  - `AuthProvider.tsx` — `getSession`, `onAuthStateChange`
  - `RedefinirSenhaPage.tsx` — `exchangeCodeForSession`, `getSession`
  - `PerfilPage.tsx` — `update` em `perfis`

### Tipos derivados em runtime
- `LancamentoTipo` (5 valores: `receita`, `fixo`, `variavel`,
  `cartao`, `investimento`) é derivado pela função `transactionType()`
  no `DashboardPage`.
- O banco só conhece `receita | despesa`. `databaseType()` no service
  converte.

### Regras de negócio em componentes / services
- "Receita só usa natureza `outro`" — vive em `CategoriasManager`
  (tab Receitas mapeia para `natureza = outro`).
- "Cartão é natureza `variavel`" — vive no `CategoriasManager`.
- "Parcelado = tipo `cartao` + `parcela_total > 1`" — vive em
  `transacoes.service`.

### Constantes
- `NO_ACTIVE_HOUSEHOLD_ID` (`'__sem_familia__'`) — em
  `household.service.ts`
- `ACTIVE_HOUSEHOLD_STORAGE_KEY` (`'mylife:household_ativo'`) — em
  `household.service.ts`
- Prefixo `mylife:tempo-plataforma:` — em `usePlatformTime.ts`

## 11. Fluxos de UX

### Onde cada ação leva
| Ação | Destino |
|---|---|
| Cadastro concluído (login automático OK) | `?redirect=` ou `/` |
| Cadastro concluído (email precisa confirmar) | `/login` (preserva redirect) |
| Login concluído | `?redirect=` > `location.state.from` > `/` |
| Recuperação de senha enviada | mesma página (card de confirmação) |
| Redefinição de senha concluída | `/` |
| Criação de família | `/` |
| Seleção de família | `/` |
| Aceite de convite | `/` (após 1,5s) |
| Recusa de convite | `/` (após 1,5s) |
| Logout | `/login` |
| Edição de perfil salva | mesma página |

### Estados vazios / sem dados
- `DashboardPage` sem household → `EmptyState` "Selecione uma família"
- `DashboardPage` com erro → `EmptyState` "Não foi possível carregar"
- `DashboardPage` tabela vazia → `EmptyState` dentro da seção
- `AceitarConvitePage` token inválido → tela de erro com CTA para `/`
- `AceitarConvitePage` sem token → tela "Link inválido"

### Comportamento de loading
- Spinner de página cheia em: `ProtectedRoute`, `HouseholdGuard`,
  `OnboardingPage`, `SelecionarHouseholdPage`, `RedefinirSenhaPage`
  (durante `exchangeCodeForSession`), `AceitarConvitePage` (durante
  verificação/aceite/recusa)
- Spinner inline em: `DashboardPage` ("Carregando..."), listas de
  convites e membros ("Carregando convites...", "Carregando membros...")

## 12. Módulos

### Ativos
- Financeiro (ícone `Wallet`, rota `/financeiro`)

### Experimental
- Lista de Mercado (ícone `ShoppingCart`, rota `/lista-mercado`).
  Existe em código, mas não é tratado como módulo oficial.

### Futuros (registrados como comentário em `app/modules.ts`)
- Rotina
- Estudos
- Saúde

## 13. Dependências (package.json)

### Produção
- `@supabase/supabase-js` — `^2.45.0`
- `@tanstack/react-query` — `^5.51.0`
- `date-fns` — `^3.6.0`
- `lucide-react` — `^0.428.0`
- `react`, `react-dom` — `^18.3.1`
- `react-hook-form` — `^7.52.0`
- `react-router-dom` — `^6.26.0`
- `recharts` — `^2.12.7`
- `sonner` — `^1.5.0`
- `zod` — `^3.23.8`
- `zustand` — `^4.5.4` (presente em `dependencies`, sem uso direto
  identificado no código)

### Desenvolvimento
- `@types/node` — `^22.4.0`
- `@types/react`, `@types/react-dom` — `^18.3.x`
- `@vitejs/plugin-react` — `^4.3.1`
- `autoprefixer` — `^10.4.20`
- `postcss` — `^8.4.41`
- `tailwindcss` — `^3.4.10`
- `typescript` — `^5.5.4`
- `vite` — `^5.4.0`

Observação: `package-lock.json` resolve versões mais recentes dentro
dessas faixas.

## 14. Pontos em aberto / código morto

### Configuração
- Nenhum conflito de configuração identificado no estado atual.

### Domínio
- `contas` é read-only no frontend (sem CRUD, sem formulário).
- `responsavel_id` existe em `transacoes` e tem campo no
  `LancamentoForm`, mas a tabela `responsaveis` é populada por seed
  (`buildSeedResponsaveis`); CRUD ainda não existe na UI.
- `atualizarStatusTransacao` exposto pelo `transacoes.service` mas não
  consumido por nenhum hook.
- `criarHousehold` é alias de `createHousehold` no `household.service`
  (sem uso).
- `usePerfil.ts` é stub, sem uso.
- `zustand` nas dependências, sem uso identificado.

### Modelo de dados
- `transacoes.tipo` no banco é `receita | despesa`; o app expõe 5
  "tipos" derivados em runtime.
- `CategoriasManager` mapeia a tab "Cartão" para `natureza = variavel`
  (não existe `natureza = cartao` no banco).

## 15. Arquivos não vistos neste levantamento

- `src/modules/lista-mercado/**` completo (só a `ListaMercadoPage` foi
  referenciada; conteúdo detalhado não foi analisado)
- Conteúdo completo de `public/` (apenas `mylife-symbol.png` é
  referenciado pelo `index.html`)
- Configurações do Supabase fora do `schema.sql` (env do projeto,
  storage, etc.)

## 16. Anexos

- `supabase/schema.sql` — fonte de verdade do banco
- `CONTEXT.md` — contexto legado (não usar como fonte de verdade)

## Fim do mapa

Este documento é um retrato factual. Não contém decisões de correção.
Prioridades e correções entram nos documentos oficiais (PRD,
ARCHITECTURE, RULES, DESIGN, TASK, MEMORY) e no backlog de correções.
