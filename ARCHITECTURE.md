# ARCHITECTURE — Como o MyLife é montado

> Documento oficial. Descreve a arquitetura técnica do produto em alto
> nível. Para o que é o produto, ver PRD.md. Para regras de trabalho, ver
> RULES.md. Este documento descreve o estado-alvo, não o estado atual.

---

## 1. Visão geral da stack

- Frontend: Vite + React 18 + TypeScript
- Estilo: Tailwind CSS (design tokens customizados)
- Backend: Supabase (Auth + Postgres + RLS)
- Estado servidor: TanStack Query
- Roteamento: React Router v6
- Formulários: React Hook Form + Zod
- Gráficos: Recharts
- Ícones: Lucide React
- Notificações: Sonner
- Deploy: Netlify

Sem backend próprio. Toda a lógica de dados e autorização mora no
Postgres do Supabase, protegida por RLS.

---

## 2. Estrutura de pastas

O projeto se organiza em três camadas:

- app/ — shell da aplicação (layout, navegação, home)
- core/ — domínio transversal (auth, household, perfil, activity)
- modules/ — um diretório por módulo do produto (financeiro, futuros)

Estrutura completa:

- src/
  - app/              (AppShell, Sidebar, Topbar, HomePage, modules.ts)
  - core/
    - auth/           (AuthProvider, ProtectedRoute, service, types, pages)
    - household/      (HouseholdProvider, HouseholdGuard, service, types, pages)
    - usuarios/       (páginas de perfil)
    - activity/       (hooks transversais)
  - modules/
    - financeiro/     (pages, components, hooks, services, types, utils)
  - components/
    - ui/             (Modal, ConfirmDialog, EmptyState, Badge)
  - lib/              (supabase, queryClient, env)
  - styles/           (globals.css)
  - App.tsx
  - main.tsx
  - router.tsx

Regra: um módulo nunca importa de outro módulo. Se algo precisa ser
compartilhado, sobe para core/ ou components/.

---

## 3. Camadas de código

Toda funcionalidade de dados segue esta hierarquia:

- Página (page)         → orquestra UI e chama hooks
- Hook (hooks/)         → encapsula React Query (query, mutation, cache)
- Serviço (services/)   → única camada que fala com Supabase
- Supabase              → banco + RLS

Regras:

- Componentes NUNCA importam supabase diretamente
- Serviços NUNCA filtram por user_id (o RLS já faz isso)
- Hooks NUNCA contêm lógica de negócio (só orquestram o service)
- Páginas NUNCA têm query SQL ou mutation direta

Exceção justificada: AuthProvider e RedefinirSenhaPage precisam acessar
supabase.auth diretamente para tratar sessão e exchange de código. Estes
são os únicos pontos autorizados a falar com o Supabase fora de services/.

---

## 4. Cadeia de providers

A ordem importa:

- main.tsx
  - QueryClientProvider
    - App
      - AuthProvider
        - HouseholdProvider
          - RouterProvider

Motivo:

- AuthProvider escuta onAuthStateChange e expõe user/perfil/loading
- HouseholdProvider depende do AuthProvider (só carrega households
  depois que o usuário está autenticado)
- RouterProvider depende de ambos para decidir qual rota renderizar

---

## 5. Roteamento

Rotas públicas:
- /login, /cadastro, /recuperar-senha, /redefinir-senha

Rotas protegidas (auth):
- /onboarding         (criar família)
- /selecionar-familia (trocar família ativa)

Rotas protegidas (auth + espaço ativo, pessoal ou familiar):
- /                   (home)
- /financeiro         (dashboard do módulo)
- /financeiro/categorias
- /perfil

Fallback: qualquer rota desconhecida redireciona para /.

Proteção em camadas:

- ProtectedRoute verifica auth
- HouseholdGuard verifica loading de household (não bloqueia se não tem
  família — apenas aguarda carregar)

---

## 6. Modelo de dados

O banco tem 8 tabelas, todas em public. Cada uma tem uma função clara:

- perfis             → espelho 1:1 de auth.users
- households         → família/grupo financeiro
- household_membros  → N:N entre usuários e households (com papel)
- categorias         → classificação de transações (tipo + natureza)
- contas             → etiquetas de origem/destino (sem saldo)
- responsaveis       → pessoas/entidades (reservado para uso futuro)
- parcelamentos      → agrupador de compras parceladas
- transacoes         → cada movimentação

Isolamento:

- Toda tabela de negócio tem household_id
- Toda tabela de negócio é isolada por household_id, inclusive o espaço pessoal
- Policies de leitura, escrita e administração verificam papel no banco
- households_delete exige papel owner
- Papéis: owner/admin gerenciam a família; membro pode ler e escrever;
  visualizador pode apenas ler dados do espaço
- Nenhum dado vaza entre households, mesmo via chamada direta à API

A fonte de verdade do schema é supabase/schema.sql. Este documento não
replica colunas — apenas descreve a função de cada tabela.

---

## 7. Fluxos principais

### Autenticação
AuthProvider escuta mudanças de sessão do Supabase. Ao logar, atualiza
user e perfil. Ao deslogar, limpa o estado.

### Household
HouseholdProvider carrega os espaços disponíveis. Escolhe o ativo usando
o localStorage ou o primeiro espaço disponível. Se o usuário ainda não
participa de uma família, cria/usa seu espaço pessoal, sem bloquear o uso
do produto. O espaço pessoal é isolado e não aceita convites.

Convites e gestão de membros ficam restritos a owner/admin. O convite define
o papel inicial; owner/admin podem alterá-lo ou remover membros. O papel
visualizador não pode criar, editar ou excluir dados de negócio. Essas
regras também são aplicadas por RLS/RPC no Supabase.

### Dados do módulo
Hooks do módulo usam React Query com queryKey composta por household +
parâmetros. Invalidação por chave-mãe. Sempre que o household ativo
muda, as queries são refeitas automaticamente.

### Parcelamento
Lançamento parcelado cria 1 linha em parcelamentos + N linhas em
transacoes (uma por mês). Cada parcela é independente e tem status
próprio.

---

## 8. Regras invioláveis

1. Nenhum componente chama supabase diretamente.
2. Nenhum import cruzado entre módulos.
3. Isolamento por RLS, nunca por filtro no frontend.
4. Um único cliente Supabase em lib/supabase.ts.
5. Sem any, sem @ts-ignore, sem eslint-disable.
6. Variáveis de ambiente apenas via import.meta.env.VITE_*.
7. Toda feature tem tipo em types/, função em services/, hook em hooks/,
   componente em components/, página em pages/.

---

## 9. Documentos relacionados

- PRD.md — o que é o produto, para quem, por quê
- RULES.md — o que pode e o que não pode ser feito
- DESIGN.md — identidade visual e componentes
- TASK.md — o que está sendo feito agora
- MEMORY.md — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
- supabase/schema.sql — fonte de verdade do banco
