# TASK — O que está sendo feito agora

> Documento oficial e vivo. Descreve em que ponto do roadmap estamos, o
> que está sendo feito no momento e o que vem imediatamente depois. Este
> arquivo é atualizado a cada mudança de fase.

## 1. Estado atual

Fase: 5 — Consolidação do módulo Financeiro
Última atualização: 2026-10-01

O módulo Financeiro está funcional: dashboard, categorias (via modal),
lançamentos classificados como receita, despesa ou investimento, natureza
fixa/variável, cartão à vista/parcelado, responsáveis ligados aos membros,
gráficos configuráveis, tabela detalhada com filtros e exportação CSV.

A base de autenticação, household e perfil está estável. Gestão de
família (convites + papéis + membros) também foi implementada como parte
desta fase. A paleta visual está migrada na quase totalidade dos
componentes.

O que resta nesta fase é consolidação: decidir sobre código morto,
fechar decisões em aberto e alinhar os documentos oficiais.

Antes desta fase, foram concluídas:

- Fase 1 — Banco de dados
- Fase 2 — Esqueleto do projeto
- Fase 3 — Autenticação
- Fase 4 — Household / Família
- Fase 5 (parcial) — Módulo Financeiro funcionando

## 2. Em andamento agora

Consolidação do módulo Financeiro. Frentes de trabalho, em ordem de
prioridade:

### 2.1 Documentação oficial

- Escrever PRD.md          — concluído
- Escrever ARCHITECTURE.md — concluído
- Escrever RULES.md        — concluído
- Escrever DESIGN.md       — concluído
- Escrever TASK.md         — concluído
- Escrever MEMORY.md       — concluído
- Atualizar MEMORY.md com convites, aceitar por RPC no banco e Home
  medindo tempo via localStorage — pendente

### 2.2 Correções de configuração

- Ajustar `.nvmrc` para Node 22 — concluído (já está em 22)
- Atualizar `index.html` (favicon → símbolo PNG; theme-color →
  `#F7F5F0`) — concluído
- Atualizar `CONTEXT.md` — mantido como legado, com aviso no topo.
  Não é mais pendência ativa.
- Atualizar `.github/copilot-instructions.md` — pendente (arquivo não
  foi revisado nesta rodada)
- Atualizar `README.md` — concluído

### 2.3 Correções de paleta visual

Migrar todos os arquivos que ainda usavam tokens antigos (`navy-*`,
`content-*`, `brand-400` como texto, `text-h4`) para a paleta oficial.
Status:

- `main.tsx` — concluído (`theme="light"` com tokens)
- `ProtectedRoute.tsx` — concluído
- `HouseholdGuard.tsx` — concluído
- `HomePage.tsx` — concluído
- `DashboardPage.tsx` — concluído
- `CategoriasManager.tsx` — concluído
- `LancamentoForm.tsx` — concluído
- `Modal.tsx` — concluído
- `ConfirmDialog.tsx` — concluído
- `EmptyState.tsx` — concluído
- `Badge.tsx` — concluído

Arquivos que não existem mais (não são pendência):

- `CategoriasPage.tsx`, `CategoriaForm.tsx`, `CategoriaItem.tsx`,
  `CategoriaList.tsx`

### 2.4 Correções de domínio

- Remover coluna `contas.saldo_inicial` — decidido em MEMORY. Se a
  coluna ainda existir no banco, remover via migration. Pendente de
  confirmação no Supabase remoto.
- `responsavel_id` em transações — responsável associado aos membros via
  trigger de membership; não há CRUD independente de responsáveis.
- `tabela responsaveis` — mantida como referência dos membros e dos dados
  históricos das transações.
- Unificar telas de categorias — resolvido: só `CategoriasManager`
  (via Modal no dashboard).
- Unificar UIs de edição de categoria — resolvido.
- Unificar funções de insert — resolvido: só `criarTransacao`.
- Unificar chamadas ao seed — resolvido: `createHousehold` faz os seeds
  e o service de categorias/responsáveis garante seeds ao listar.
- Remover wrapper `createHouseholdService` redundante — pendente: o
  `household.service.ts` ainda expõe `criarHousehold` como alias de
  `createHousehold`, sem uso.
- `atualizarStatusTransacao` — pendente: decidir entre usar ou remover
  do service (não é consumido por nenhum hook).
- `CredenciaisLogin`/`CredenciaisCadastro` — resolvido: não existem
  mais em `auth/types.ts`.
- Variantes do `Badge` (`warning`, `danger`) — pendente: decidir entre
  implementar ou remover da documentação (DESIGN.md já registra como
  planejadas).

### 2.5 Correções de componentes

- `Modal` — concluído: tem ESC, focus trap, fechamento por overlay e
  devolve foco. `id="modal-title"` continua fixo — se dois modais forem
  abertos simultaneamente, colidem. Não é problema hoje, mas fica
  registrado.
- `ConfirmDialog` — concluído: não duplica mais a `description`.
- `CategoriaItem` — resolvido: o arquivo não existe mais.
- `EmptyState` — concluído: usa ícone Lucide (`Inbox`).
- `Badge` — pendente: ver 2.4.

### 2.6 Correções de fluxo

- Cadastro logar direto — resolvido: tenta `signUp` + `loginUsuario`
  automático, com fallback para `/login` se o email exigir confirmação.
- Redefinição de senha — resolvido: navega para `/` após salvar.
- Tratamento de "usuário já autenticado" em login/cadastro —
  concluído: ambas as páginas redirecionam via `useEffect` quando
  `isAuthenticated`.
- Campo de responsável no `LancamentoForm` — vinculado aos membros; no
  espaço pessoal seleciona automaticamente o usuário autenticado.

## 3. Imediatamente depois

Assim que a consolidação fechar:

- Fase 6 — CRUD de Contas (criar/editar/excluir conta no app)
- Fase 7 — Refinamento do dashboard (métricas adicionais)
- Fase 8 — Deploy Netlify
- Fase 9 — Primeiro módulo novo (Rotina ou similar)

Gestão de família (convites + papéis + membros) foi antecipada e já
está implementada dentro da Fase 5. Não é mais uma fase separada.
Responsáveis agora acompanham memberships; importação CSV saiu do escopo,
e exportação CSV/Excel permanece na tabela detalhada.

Nenhuma das fases seguintes começa antes da anterior estar concluída e
revisada.

## 4. Regras de operação

1. Uma frente por vez. Não abrir duas frentes de trabalho em paralelo.
2. Antes de mexer em qualquer arquivo, conferir se ele está na lista de
   pendências e por qual motivo.
3. Ao concluir uma frente, marcar como feito nesta lista e commit.
4. Se surgir algo fora do planejado, não implementar — anotar aqui em
   "ideias futuras" e seguir o plano.
5. Se algo da lista ficar obsoleto (porque mudamos de ideia), remover
   daqui e registrar no MEMORY.md com o motivo.

## 5. Ideias futuras (fora do plano atual)

Registradas aqui para não esquecer, mas sem compromisso de implementação:

- Página de parcelamentos (visão agrupada de todas as compras em Nx)
- Cálculo de saldo por conta (não é o foco, mas já foi sugerido)
- Integração com Open Finance
- Notificações de vencimento
- Modo claro/escuro alternável
- Suporte a múltiplas moedas
- Módulo Lista de Mercado — hoje existe como experimental; decisão
  pendente sobre virar módulo oficial ou ser removido

## 6. Documentos relacionados

- PRD.md — o que é o produto
- ARCHITECTURE.md — como o produto é montado
- RULES.md — o que pode e o que não pode
- DESIGN.md — identidade visual
- MEMORY.md — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
