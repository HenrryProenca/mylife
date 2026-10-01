# TASK — O que está sendo feito agora

> Documento oficial e vivo. Descreve em que ponto do roadmap estamos, o
> que está sendo feito no momento e o que vem imediatamente depois. Este
> arquivo é atualizado a cada mudança de fase.

---

## 1. Estado atual

Fase: 5 — Consolidação do módulo Financeiro
Última atualização: 2026-10-01

O módulo Financeiro está funcional. Tem dashboard, categorias, transações,
parcelamento, contas como etiqueta e import/export CSV. Os fluxos
principais funcionam ponta a ponta.

O que resta nesta fase é consolidação: alinhar a paleta visual em todos os
componentes, unificar decisões duplicadas, remover código morto e ajustar
configurações. Não é implementação de funcionalidade nova — é fechamento
do que já existe.

Antes desta fase, foram concluídas:

- Fase 1 — Banco de dados
- Fase 2 — Esqueleto do projeto
- Fase 3 — Autenticação
- Fase 4 — Household / Família
- Fase 5 (parcial) — Módulo Financeiro funcionando

---

## 2. Em andamento agora

Consolidação do módulo Financeiro. As frentes de trabalho, em ordem de
prioridade:

### 2.1 Documentação oficial
- Escrever PRD.md          [concluído]
- Escrever ARCHITECTURE.md [concluído]
- Escrever RULES.md        [concluído]
- Escrever DESIGN.md       [concluído]
- Escrever TASK.md         [concluído]
- Escrever MEMORY.md       [pendente]

### 2.2 Correções de configuração
- Ajustar `.nvmrc` para Node 22 (Supabase 2.117.1 exige)
- Atualizar `index.html` (favicon → símbolo PNG; theme-color → #F7F5F0)
- Atualizar `CONTEXT.md` (paleta antiga nas seções 7, 8, 10)
- Atualizar `.github/copilot-instructions.md` (mesma desatualização)
- Atualizar `README.md` (está truncado)

### 2.3 Correções de paleta visual
Migrar todos os arquivos que ainda usam tokens antigos (`navy-*`,
`content-*`, `brand-400`, `text-h4`) para a paleta oficial:

- `main.tsx` — Toaster
- `ProtectedRoute.tsx` — spinner
- `HouseholdGuard.tsx` — spinner
- `HomePage.tsx` — Recharts + textos
- `DashboardPage.tsx` — Recharts + uma classe
- `CategoriasPage.tsx` — abas
- `CategoriaForm.tsx`
- `CategoriaItem.tsx`
- `CategoriaList.tsx`
- `CategoriasManager.tsx`
- `LancamentoForm.tsx`
- `Modal.tsx`
- `ConfirmDialog.tsx`
- `EmptyState.tsx`
- `Badge.tsx`

Também: substituir hex hardcoded em `chartColor()`, nos gráficos do
Recharts e nos fallbacks por tokens da paleta oficial.

### 2.4 Correções de domínio
- Remover coluna `contas.saldo_inicial` no Supabase
- Decidir sobre `responsavel_id` em transações (manter sem UI ou
  implementar campo)
- Decidir sobre a tabela `responsaveis` (manter reservada ou remover)
- Unificar as duas telas de categorias (`CategoriasPage` + `CategoriasManager`)
- Unificar as duas UIs de edição de categoria (`CategoriaForm` + inline)
- Unificar as duas funções de insert (`criarTransacao` + `criarLancamento`)
- Unificar as duas chamadas ao seed (createHousehold + garantirCategoriasPadrao)
- Remover wrapper `createHouseholdService` redundante no HouseholdProvider
- Decidir sobre `atualizarStatus` do useTransacoes (usar ou remover)
- Decidir sobre `CredenciaisLogin` e `CredenciaisCadastro` (usar ou remover)
- Decidir sobre variantes não usadas do Badge (`warning`, `danger`)

### 2.5 Correções de componentes
- `Modal`: adicionar focus trap, ESC para fechar, clicar overlay para
  fechar, corrigir `id="modal-title"` fixo
- `ConfirmDialog`: remover duplicação do `description`
- `CategoriaItem`: parar de usar `.slice(0, 2)` do ícone como texto
- `EmptyState`: substituir o bullet por ícone Lucide
- `Badge`: decidir se remove variantes não usadas ou as documenta

### 2.6 Correções de fluxo
- Decidir se `/cadastro` deve logar direto ou continuar redirecionando
  para `/login`
- Decidir se `/redefinir-senha` deve voltar para `/` ou `/financeiro`
- Adicionar tratamento de "usuário já autenticado" nas páginas de login
  e cadastro
- Decidir sobre o campo de responsável no `LancamentoForm`

---

## 3. Imediatamente depois

Por solicitação do usuário, a gestão de família foi antecipada e entregue:
convites com papel, alteração de permissões, remoção de membros e uso de
espaço pessoal sem associação obrigatória a família. A consolidação do
Financeiro continua sendo a fase principal do roadmap.

Assim que a consolidação fechar:

- Fase 6 — CRUD de Contas (criar/editar/excluir conta no app)
- Fase 7 — CRUD de Responsáveis (se decidido manter a tabela)
- Fase 8 — Refinamento do dashboard (métricas adicionais)
- Fase 9 — Importação CSV avançada (detecção de cabeçalho)
- Fase 10 — Gestão de família (convites, papéis) [entregue antecipadamente]
- Fase 11 — Deploy Netlify
- Fase 12 — Primeiro módulo novo (Rotina ou similar)

Nenhuma dessas fases começa antes da anterior estar concluída e revisada.

---

## 4. Regras de operação

1. Uma frente por vez. Não abrir duas frentes de trabalho em paralelo.

2. Antes de mexer em qualquer arquivo, conferir se ele está na lista de
   pendências e por qual motivo.

3. Ao concluir uma frente, marcar como feito nesta lista e commit.

4. Se surgir algo fora do planejado, não implementar — anotar aqui em
   "ideias futuras" e seguir o plano.

5. Se algo da lista ficar obsoleto (porque mudamos de ideia), remover
   daqui e registrar no MEMORY.md com o motivo.

---

## 5. Ideias futuras (fora do plano atual)

Registradas aqui para não esquecer, mas sem compromisso de implementação:

- Página de parcelamentos (visão agrupada de todas as compras em Nx)
- Cálculo de saldo por conta (não é o foco, mas já foi sugerido)
- Integração com Open Finance
- Notificações de vencimento
- Modo claro/escuro alternável
- Suporte a múltiplas moedas

---

## 6. Documentos relacionados

- PRD.md — o que é o produto
- ARCHITECTURE.md — como o produto é montado
- RULES.md — o que pode e o que não pode
- DESIGN.md — identidade visual
- MEMORY.md — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
