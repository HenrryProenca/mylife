# Mapa do Projeto — MyLife

> Documento de trabalho. Levantamento factual do estado atual do projeto.
> Não contém sugestões de correção. Serve como base para priorização e para
> a escrita dos documentos oficiais (PRD, ARCHITECTURE, RULES, DESIGN, TASK, MEMORY).
>
> Última atualização: 2026-09-28

---

## 1. Visão geral

- Produto: MyLife — suíte pessoal de organização de vida
- Módulo ativo: Financeiro
- Módulo em teste (não foco): Lista de Mercado
- Stack: Vite + React 18 + TypeScript + Tailwind + Supabase + TanStack Query + React Router v6
- Backend: Supabase (Auth + Postgres + RLS)
- Deploy alvo: Netlify

---

## 2. Estrutura de pastas (estado atual)

- src/
  - app/
    - AppShell.tsx
    - HomePage.tsx
    - Sidebar.tsx
    - Topbar.tsx
    - modules.ts
  - core/
    - activity/
      - usePlatformTime.ts
    - auth/
      - AuthProvider.tsx
      - ProtectedRoute.tsx
      - auth.service.ts
      - types.ts
      - useAuth.ts
      - pages/
        - CadastroPage.tsx
        - LoginPage.tsx
        - RecuperarSenhaPage.tsx
        - RedefinirSenhaPage.tsx
    - household/
      - HouseholdGuard.tsx
      - HouseholdProvider.tsx
      - household.service.ts
      - types.ts
      - useHousehold.ts
      - pages/
        - OnboardingPage.tsx
        - SelecionarHouseholdPage.tsx
    - usuarios/
      - pages/
        - PerfilPage.tsx
  - modules/
    - financeiro/
      - pages/
        - DashboardPage.tsx
        - CategoriasPage.tsx
      - components/
        - CategoriaForm.tsx
        - CategoriaItem.tsx
        - CategoriaList.tsx
        - CategoriasManager.tsx
        - LancamentoForm.tsx
      - hooks/
        - useCategorias.ts
        - useContas.ts
        - useTransacoes.ts
      - services/
        - categorias.service.ts
        - contas.service.ts
        - transacoes.service.ts
      - types/
        - categorias.types.ts
        - contas.types.ts
        - transacoes.types.ts
      - utils/
        - seedCategorias.ts
    - lista-mercado/   (teste — ignorar)
  - components/
    - ui/
      - Badge.tsx
      - ConfirmDialog.tsx
      - EmptyState.tsx
      - Modal.tsx
  - lib/
    - env.ts
    - queryClient.ts
    - supabase.ts
  - styles/
    - globals.css
  - App.tsx
  - main.tsx
  - router.tsx

  ---

## 3. Configuração (arquivos de raiz)

| Arquivo | Estado |
|---|---|
| package.json | Deps em versões estáveis |
| package-lock.json | Supabase resolveu para 2.117.1 que exige Node >=22.0.0 |
| .nvmrc | Fixa 20 — conflita com Supabase 2.117.1 |
| tailwind.config.ts | Paleta nova (canvas/brand/ink) |
| postcss.config.js | OK |
| vite.config.ts | OK, alias @ apontando para ./src |
| tsconfig.json | Strict, paths @/* |
| tsconfig.node.json | OK |
| netlify.toml | OK |
| index.html | Favicon aponta para /favicon.svg; theme-color ainda é #081224 |
| .env.example | OK |
| .gitignore | OK |
| .editorconfig | OK |
| .gitattributes | OK |
| .github/copilot-instructions.md | Desatualizado (paleta antiga, Passo 5) |
| CONTEXT.md | Desatualizado em 3 seções (7, 8, 10) |
| README.md | Truncado (não vi o conteúdo completo) |
| supabase/schema.sql | Tabela contas tem saldo_inicial (coluna morta) |

---

## 4. Rotas

### Públicas
- /login
- /cadastro
- /recuperar-senha
- /redefinir-senha

### Protegidas (auth)
- /onboarding → OnboardingPage
- /selecionar-familia → SelecionarHouseholdPage

### Protegidas (auth + household)
Envolvidas por HouseholdGuard + AppShell:
- / (index) → HomePage
- /financeiro → DashboardPage
- /financeiro/categorias → CategoriasPage
- /lista-mercado → ListaMercadoPage (teste)
- /perfil → PerfilPage

### Fallback
- * → redireciona para /

---

## 5. Cadeia de providers

- main.tsx
  - QueryClientProvider
    - App.tsx
      - AuthProvider
        - HouseholdProvider
          - RouterProvider

Detalhes:
- AuthProvider escuta onAuthStateChange do Supabase
- HouseholdProvider espera authLoading terminar, depois chama refreshHouseholds
- Nenhum dos dois bloqueia a renderização fora de loading

---

## 6. Fluxos principais

### Cadastro
/cadastro → cadastrarUsuario → toast "Conta criada! Faça login para continuar." → navega para /login

### Login
/login → loginUsuario → navega para location.state.from.pathname (ou / como padrão)

### Recuperação de senha
/recuperar-senha → enviarEmailRecuperacao → mostra card de confirmação (não redireciona)

### Redefinição de senha
/redefinir-senha?code=xxx → exchangeCodeForSession → form → atualizarSenha → navega para /financeiro

### Criação de família
/onboarding → createHousehold → cria household + membership owner + seed de 75 categorias → navega para /

### Exclusão de família
/selecionar-familia → deleteHousehold → service valida created_by → provider recarrega lista → localStorage é atualizado via aplicarHouseholds

### Lançamento simples
DashboardPage → LancamentoForm → criarTransacao → criarLancamento → insert em transacoes

### Lançamento parcelado
LancamentoForm (com tipo = 'cartao' e parcela_total > 1) → criarLancamento:
1. Insert em parcelamentos
2. Gera N linhas em transacoes (uma por mês)
3. Cada linha tem parcelamento_id, parcela_atual, parcela_total

### Import/Export CSV
- Import: dentro de DashboardPage — assume Data, Descrição, Valor (mínimo 3 colunas), usa primeira categoria de despesa, tipo variavel, forma pix, status concluida
- Export: dentro de DashboardPage — cabeçalho Data, Descrição, Categoria, Tipo, Forma de pagamento, Instituição, Parcela, Valor

---

## 7. Modelo de dados (Supabase)

### Tabelas
- perfis (espelho de auth.users)
- households
- household_membros
- categorias
- contas
- responsaveis
- parcelamentos
- transacoes
- lista_mercado_itens (teste)

### Colunas mortas / não usadas
- contas.saldo_inicial — existe no banco, não está no tipo frontend
- transacoes.responsavel_id — existe no banco, não tem campo no form
- Tabela responsaveis — existe no banco, não tem service, hook ou tela

### RLS
- Todas as tabelas de negócio têm policy is_household_member(household_id)
- households_delete exige papel owner
- household_membros permite insert do próprio owner + insert por admin/owner
- Função is_household_member é security definer

### Triggers
- set_updated_at em todas as tabelas com updated_at
- handle_new_user cria perfil quando usuário se cadastra

---

## 8. Estado da paleta visual

### 100% migrado para off-white/cobalto
- tailwind.config.ts, globals.css
- AppShell.tsx, Sidebar.tsx, Topbar.tsx
- LoginPage.tsx, CadastroPage.tsx, RecuperarSenhaPage.tsx, RedefinirSenhaPage.tsx
- PerfilPage.tsx
- OnboardingPage.tsx, SelecionarHouseholdPage.tsx

### Ainda com paleta antiga (parcial ou total)
- main.tsx (Toaster com theme="dark")
- ProtectedRoute.tsx, HouseholdGuard.tsx (spinners)
- HomePage.tsx (Recharts + textos)
- DashboardPage.tsx (Recharts + divide-navy-600)
- CategoriasPage.tsx (abas)
- CategoriaForm.tsx, CategoriaItem.tsx, CategoriaList.tsx, CategoriasManager.tsx, LancamentoForm.tsx
- Modal.tsx, ConfirmDialog.tsx, EmptyState.tsx, Badge.tsx

### Tokens inexistentes que estão sendo usados
- bg-navy-950, bg-navy-900, bg-navy-800, bg-navy-700
- border-navy-600, divide-navy-600
- text-content-primary, text-content-secondary, text-brand-400
- text-h4

### Cores hardcoded (hex) em vários lugares
- CategoriaItem — fallback #2F63F2
- DashboardPage — chartColor() com hex da paleta antiga e dos estados
- HomePage — cores fixas nos gráficos
- ConfirmDialog, Badge — cores da paleta padrão do Tailwind (red-500, yellow-500)

---

## 9. Componentes duplicados ou com funções sobrepostas

| Duplicação | Arquivos |
|---|---|
| Duas telas de categorias | CategoriasPage (rota) + CategoriasManager (modal no dashboard) |
| Duas UIs de edição de categoria | CategoriaForm (form completo) + CategoriasManager (inline) |
| Duas entradas para "cartão" | CategoriaForm (só natureza) + CategoriasManager (tab própria) |
| Duas chamadas ao seed | createHousehold + useCategorias.garantirCategoriasPadrao |
| Duas funções de insert | criarTransacao + criarLancamento |
| Dois modais de confirmação | ConfirmDialog (UI) + modal inline no SelecionarHouseholdPage |

---

## 10. Padrões internos

### Acesso ao Supabase
- Services usam supabase de @/lib/supabase
- Exceções (acesso direto):
  - PerfilPage.tsx — update em perfis
  - RedefinirSenhaPage.tsx — exchangeCodeForSession, getSession
  - AuthProvider.tsx — getSession, onAuthStateChange

### Tipos derivados em runtime
- LancamentoTipo (5 valores: receita, fixo, variavel, cartao, investimento) é derivado pela função transactionType() no DashboardPage
- O banco só conhece receita e despesa — databaseType() no service converte

### Regras de negócio em componentes
- "Receita só tem natureza outro" — vive no CategoriaForm
- "Cartão é natureza variavel" — vive no CategoriasManager
- "Parcelado = tipo cartão + parcela_total > 1" — vive no transacoes.service

### Constantes hardcoded
- __sem_familia__ — duplicado em household.service e SelecionarHouseholdPage
- #2F63F2 — fallback de cor em CategoriaItem
- Cores de gráfico em DashboardPage e HomePage

---

## 11. Fluxos de UX

### Onde cada ação leva
| Ação | Destino |
|---|---|
| Cadastro concluído | /login |
| Login concluído | location.state.from ou / |
| Recuperação de senha enviada | mesma página (mostra card de confirmação) |
| Redefinição de senha concluída | /financeiro |
| Criação de família | / |
| Seleção de família | / |
| Logout | /login |
| Edição de perfil salva | mesma página |
| Lançamento salvo | mesma página (toast) |

### Estados vazios / sem dados
- DashboardPage sem household → EmptyState "Selecione uma família"
- DashboardPage com erro → EmptyState "Não foi possível carregar"
- CategoriasPage sem household → EmptyState com CTA para /onboarding
- CategoriaList vazio → EmptyState com botão "+ Nova categoria"
- DashboardPage tabela vazia → EmptyState dentro da seção

### Comportamento de loading
- Spinner de página cheia em: ProtectedRoute, HouseholdGuard, OnboardingPage, SelecionarHouseholdPage
- Spinner inline em: DashboardPage ("Carregando..."), CategoriasPage ("Carregando categorias...")

---

## 12. Módulos futuros

Registrados em app/modules.ts como comentados (não ativos):
- Rotina
- Estudos
- Saúde

Ativos hoje:
- Financeiro (Wallet)
- Lista de Mercado (ShoppingCart) — teste

---

## 13. Dependências

### Produção
- @supabase/supabase-js — resolveu para 2.117.1 (exige Node >= 22)
- @tanstack/react-query — resolveu para 5.103.2
- date-fns — 3.6.0
- lucide-react — 0.428.0
- react, react-dom — 18.3.1
- react-hook-form — 7.88.0
- react-router-dom — 6.30.6
- recharts — 2.15.4 (deprecated no lockfile)
- sonner — 1.7.4
- zod — 3.25.76
- zustand — 4.5.7 (não vejo uso direto no código)

### Desenvolvimento
- @vitejs/plugin-react — 4.7.0
- autoprefixer — 10.6.1
- postcss — 8.5.28
- tailwindcss — 3.4.19
- typescript — 5.9.3
- vite — 5.4.21

---

## 14. Conflitos identificados

### Configuração
- .nvmrc = 20, mas @supabase/supabase-js 2.117.1 exige Node >= 22
- index.html favicon aponta para /favicon.svg (arquivo antigo), theme-color = #081224
- CONTEXT.md e .github/copilot-instructions.md desatualizados em relação ao código atual

### Paleta
- 13 arquivos ainda usam tokens da paleta antiga (navy/content) que não existem mais no Tailwind
- 5 tokens inexistentes em uso: bg-navy-950, bg-navy-900, bg-navy-800, bg-navy-700, divide-navy-600, text-h4

### Domínio
- contas é read-only no frontend, sem CRUD, sem seed, sem formulário
- responsavel_id existe em transacoes mas não tem campo no LancamentoForm
- saldo_inicial em contas no banco, não usada no app
- CredenciaisLogin, CredenciaisCadastro definidos em auth/types mas não usados
- atualizarStatus exposto pelo useTransacoes mas não consumido
- criarTransacao e criarLancamento fazem o mesmo insert com assinaturas diferentes

### Modelo de dados
- transacoes.tipo no banco é receita | despesa; o app expõe 5 "tipos" derivados em runtime
- CategoriaForm só mostra natureza outro para receitas; o banco permite qualquer natureza
- CategoriasManager tem tab "Cartão" que mapeia para natureza = variavel

### Componentes
- Modal sem focus trap, sem ESC, sem fechar no overlay
- Modal com id="modal-title" fixo
- ConfirmDialog renderiza description duas vezes (header + body)
- CategoriaItem mostra .slice(0, 2) do campo icone como "iniciais"
- EmptyState usa bullet de texto em vez de um ícone Lucide

---

## 15. Arquivos não vistos neste levantamento

- src/modules/lista-mercado/** (teste — ignorar por ora)
- Qualquer arquivo em src/hooks/ ou src/utils/ fora de lib/
- Conteúdo completo do README.md

---

## 16. Anexos

- supabase/schema.sql — fonte de verdade do banco
- .github/copilot-instructions.md — instruções do Copilot (desatualizado)
- CONTEXT.md — contexto do projeto (desatualizado)

---

## Fim do mapa

Este documento é um retrato factual. Não contém decisões de correção.
Prioridades e correções entram nos documentos oficiais (PRD, ARCHITECTURE,
RULES, DESIGN, TASK, MEMORY) e no backlog de correções.