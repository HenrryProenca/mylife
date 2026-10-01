# ARCHITECTURE — Como o MyLife é montado

> Documento oficial. Descreve a arquitetura técnica do produto. Para o
> que é o produto, ver PRD.md. Para regras de trabalho, ver RULES.md.
> Este documento reflete o estado atual da implementação.

## 1. Visão geral da stack

- Frontend: Vite + React 18 + TypeScript
- Estilo: Tailwind CSS (design tokens customizados em `tailwind.config.ts`)
- Backend: Supabase (Auth + Postgres + RLS)
- Estado servidor: TanStack Query
- Roteamento: React Router v6 (`createBrowserRouter`)
- Formulários: React Hook Form + Zod
- Gráficos: Recharts
- Ícones: Lucide React
- Notificações: Sonner
- Deploy: Netlify

Sem backend próprio. Toda a lógica de dados e autorização mora no
Postgres do Supabase, protegida por RLS.

## 2. Estrutura de pastas

Três camadas principais:

- `app/` — shell da aplicação (layout, navegação, home)
- `core/` — domínio transversal (auth, household, usuarios, activity)
- `modules/` — um diretório por módulo do produto (financeiro, lista-mercado)

Estrutura completa atual:

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
      - `pages/` — LoginPage, CadastroPage, RecuperarSenhaPage, RedefinirSenhaPage
    - `household/`
      - `HouseholdGuard.tsx`
      - `HouseholdProvider.tsx`
      - `household.service.ts`
      - `convites.service.ts`
      - `convites.types.ts`
      - `types.ts`
      - `useHousehold.ts`
      - `components/` — FamilyInviteForm, FamilyInvitesList, FamilyMembersList, GerenciarFamiliaPanel
      - `hooks/` — useConvites, useMembros
      - `pages/` — AceitarConvitePage, OnboardingPage, SelecionarHouseholdPage
    - `usuarios/`
      - `usePerfil.ts` (stub — retorna `null`)
      - `pages/` — PerfilPage
  - `modules/`
    - `financeiro/`
      - `pages/` — DashboardPage
      - `components/` — CategoriasManager, LancamentoForm
      - `hooks/` — useCategorias, useContas, useResponsaveis, useTransacoes
      - `services/` — categorias, contas, responsaveis, transacoes
      - `types/` — categorias, contas, responsaveis, transacoes
      - `utils/` — seedCategorias, seedResponsaveis
    - `lista-mercado/` (experimental)
      - `pages/` — ListaMercadoPage
  - `components/`
    - `ui/` — Badge, ConfirmDialog, EmptyState, Modal
  - `lib/`
    - `env.ts`, `queryClient.ts`, `supabase.ts`
  - `styles/`
    - `globals.css`
  - `App.tsx`, `main.tsx`, `router.tsx`

Regra: um módulo nunca importa de outro módulo. Se algo precisa ser
compartilhado, sobe para `core/` ou `components/`.

## 3. Camadas de código

Toda funcionalidade de dados segue esta hierarquia:

- Página (`pages/`)          → orquestra UI e chama hooks
- Hook (`hooks/`)            → encapsula React Query (query, mutation, cache)
- Serviço (`services/`)      → única camada que fala com Supabase
- Supabase                   → banco + RLS

Regras:

- Componentes nunca importam `supabase` diretamente
- Serviços nunca filtram por `user_id` (o RLS já faz isso)
- Hooks nunca contêm lógica de negócio (só orquestram o service)
- Páginas nunca têm query SQL ou mutation direta

Exceções justificadas (acesso direto ao Supabase fora de `services/`):

- `AuthProvider.tsx` — `getSession`, `onAuthStateChange`
- `RedefinirSenhaPage.tsx` — `exchangeCodeForSession`, `getSession`
- `PerfilPage.tsx` — `update` direto na tabela `perfis`

O `convites.service.ts` também usa `.from()` e `.rpc()`, mas está dentro
de `services/`, então segue a regra.

## 4. Cadeia de providers

A ordem importa:

- `main.tsx`
  - `QueryClientProvider`
    - `App.tsx`
      - `AuthProvider`
        - `HouseholdProvider`
          - `RouterProvider`

Motivo:

- `AuthProvider` escuta `onAuthStateChange` e expõe `user` / `perfil` / `loading`
- `HouseholdProvider` depende do `AuthProvider` (só carrega households
  depois que o usuário está autenticado)
- `RouterProvider` depende de ambos para decidir qual rota renderizar

`main.tsx` também monta o `<Toaster />` do Sonner (posição `bottom-right`,
tema `light`, estilo inline com tokens da paleta oficial).

## 5. Roteamento

Rotas públicas:

- `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`
- `/aceitar-convite` — também pública. Se o usuário não estiver
  autenticado, a própria página redireciona para
  `/login?redirect=/aceitar-convite?token=...`

Rotas protegidas (auth):

- `/onboarding`
- `/selecionar-familia`

Rotas protegidas (auth + household), dentro do `AppShell`:

- `/` (index) — HomePage
- `/financeiro` — DashboardPage
- `/lista-mercado` — ListaMercadoPage (experimental)
- `/perfil` — PerfilPage

Fallback: qualquer rota desconhecida redireciona para `/`.

Proteção em camadas:

- `ProtectedRoute` verifica auth
- `HouseholdGuard` verifica loading de household. Não bloqueia se o
  usuário não tem família — apenas aguarda o carregamento terminar.

## 6. Modelo de dados

O banco tem 10 tabelas em `public`, todas com RLS ligado:

- `perfis` — espelho 1:1 de `auth.users`
- `households` — família/grupo financeiro
- `household_membros` — N:N entre usuários e households (com papel)
- `categorias` — classificação de transações (tipo + natureza)
- `contas` — etiquetas de origem/destino (sem saldo)
- `responsaveis` — responsáveis por movimentações
- `parcelamentos` — agrupador de compras parceladas
- `transacoes` — cada movimentação
- `household_convites` — convites pendentes, aceitos ou cancelados
- `lista_mercado_itens` — itens da lista de mercado por household

Isolamento:

- Toda tabela de negócio tem `household_id`
- Toda policy usa a função `is_household_member(household_id)`
- `households_delete` exige papel `owner`
- Papéis: owner/admin gerenciam membros; membro pode ler e escrever;
  visualizador pode somente ler dados de negócio
- Espaço pessoal segue o mesmo isolamento por `household_id` e não aceita convites
- Policies/RPC no banco impõem permissões de leitura, escrita e gestão
- Nenhum dado vaza entre households, mesmo via chamada direta à API

Funções e triggers definidos em `supabase/schema.sql`:

- `set_updated_at()` — trigger em todas as tabelas com `updated_at`
- `handle_new_user()` — trigger em `auth.users` que cria perfil,
  household pessoal (`<PrimeiroNome> (pessoal)`) e membership owner
- `sync_responsavel_household_member()` — mantém um responsável associado
  a cada membro em cada household
- `sync_responsavel_perfil_nome()` — mantém o nome do responsável igual ao
  perfil do membro
- `is_household_member(uuid)` — usada nas policies de RLS
- `aceitar_convite(uuid)` — RPC que aceita convite por token
- `cancelar_convite(uuid)` — RPC que cancela convite pendente
  (usada também para recusar; o front expõe `recusarConvite` como
  wrapper semântico)

A fonte de verdade do schema é `supabase/schema.sql`.

## 7. Fluxos principais

### Autenticação

`AuthProvider` escuta mudanças de sessão do Supabase. Ao logar, atualiza
`user` e `perfil` (via `garantirPerfil` + fallback para `buscarPerfil`).
Ao deslogar, limpa o estado.

### Cadastro

`CadastroPage` chama `cadastrarUsuario` (Supabase `signUp` com
`raw_user_meta_data.nome`). Em seguida tenta `loginUsuario` para
autenticar automaticamente. Se o login automático funcionar, o
`AuthProvider` detecta via `onAuthStateChange` e a página redireciona
para o destino (`?redirect=` ou `/`). Se o email exigir confirmação,
navega para `/login` com toast informativo e preserva `redirect`.

### Redefinição de senha

`RedefinirSenhaPage` procura `?code=` na querystring ou no hash, chama
`supabase.auth.exchangeCodeForSession(code)` e, se OK, exibe o
formulário. Sem code, tenta `getSession`. Ao salvar, chama
`atualizarSenha` e navega para `/`.

### Household

`HouseholdProvider` carrega todos os espaços do usuário via
`listarHouseholdsDoUsuario`. Escolhe o ativo: primeiro tenta o
`localStorage` (chave `mylife:household_ativo`); se não existir ou não
estiver na lista, usa o primeiro da lista. Usuários sem família usam seu
household pessoal criado no cadastro, sem bloqueio de acesso ao produto.

Convites e gestão de membros são restritos a owner/admin. O papel
visualizador não pode criar, editar ou excluir dados de negócio; essa
restrição também é aplicada no banco por RLS/RPC.

### Criação de família

`OnboardingPage` chama `createHousehold`, que faz:

1. `garantirPerfil` do usuário
2. Insert em `households`
3. Insert em `household_membros` com papel `owner`
4. Seed de categorias padrão (`buildSeedCategorias`)
5. O trigger de membership cria o responsável ligado ao usuário

Em caso de falha nos seeds, faz rollback (deleta categorias, membership e
household, na ordem inversa). O nome sugerido é `Família <PrimeiroNome>`.

### Responsáveis e lançamentos

Cada membership tem um responsável vinculado por `user_id`; o nome é
sincronizado com `perfis.nome`. No espaço pessoal, o responsável padrão é
automaticamente o usuário autenticado. O banco armazena `transacoes.tipo`
como `receita` ou `despesa`; investimento é distinguido pela natureza da
categoria. Despesas usam natureza `fixo` ou `variavel`. Pagamento por
cartão de crédito grava `tipo_no_cartao` como `avista` ou `parcelado`.

O dashboard mantém “Entrou vs Saiu” e oferece dois gráficos configuráveis
por categoria, instituição, forma de pagamento, descrição ou responsável.
Exportação CSV compatível com Excel fica na tabela “Lançamentos
detalhados”; não há importação de planilhas.

### Convites

`GerenciarFamiliaPanel` (dentro de `/selecionar-familia`) monta o
`FamilyInviteForm`. Ao criar convite, insere em `household_convites`
com `status = 'pendente'` e `token` UUID gerado pelo banco. O link é
`${origin}/aceitar-convite?token=...`, copiado para o clipboard.

`AceitarConvitePage` valida token, status e email (compara com
`user.email`), busca o nome do household, e oferece Aceitar ou Recusar.
Ambas chamam RPCs no banco: `aceitar_convite` cria o membership e marca
o convite como `aceito`; `cancelar_convite` marca como `cancelado`.
A página ainda chama `refreshHouseholds` e `setActiveHousehold` após
aceitar, e navega para `/` após 1,5s.

Observação: a policy de RLS em `household_convites` bloqueia
`update`/`delete` direto pelo cliente. Toda mutação passa por RPC.

### Dados do módulo

Hooks do módulo usam React Query com `queryKey` composta por household
+ parâmetros. Invalidação por chave-mãe. Sempre que o household ativo
muda, as queries são refeitas automaticamente.

### Parcelamento

Lançamento parcelado (cartão de crédito, tipo no cartão `parcelado` e
`parcela_total > 1`) cria 1 linha
em `parcelamentos` + N linhas em `transacoes` (uma por mês, via
`addMonths` de date-fns, a partir da data da primeira parcela). Cada
parcela é independente e tem status próprio. O valor de cada parcela
é `valor_total / total_parcelas`.

### Home / tempo de uso

`usePlatformTime` mede o tempo de uso por usuário, persistindo em
`localStorage` sob a chave `mylife:tempo-plataforma:<userId>`. Faz
flush a cada 60s e em `visibilitychange`. A Home consolida em uma
semana (segunda a domingo) e exibe gráfico de barras.

## 8. Regras invioláveis

1. Nenhum componente chama `supabase` diretamente (exceções acima).
2. Nenhum import cruzado entre módulos.
3. Isolamento por RLS, nunca por filtro no frontend.
4. Um único cliente Supabase em `lib/supabase.ts`.
5. Sem `any`, sem `@ts-ignore`, sem `eslint-disable`.
6. Variáveis de ambiente apenas via `import.meta.env.VITE_*`,
   validadas no boot por `lib/env.ts`.
7. Toda feature tem tipo em `types/`, função em `services/`, hook em
   `hooks/`, componente em `components/` e página em `pages/`.

## 9. Documentos relacionados

- PRD.md — o que é o produto, para quem, por quê
- RULES.md — o que pode e o que não pode ser feito
- DESIGN.md — identidade visual e componentes
- TASK.md — o que está sendo feito agora
- MEMORY.md — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
- supabase/schema.sql — fonte de verdade do banco
