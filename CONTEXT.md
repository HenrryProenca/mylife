> ⚠️ ARQUIVO LEGADO
>
> Este documento foi substituído pelos 6 documentos oficiais:
> PRD.md, ARCHITECTURE.md, RULES.md, DESIGN.md, TASK.md, MEMORY.md.
>
> Mantido apenas como referência histórica. Não usar como fonte de verdade.
> Algumas seções (7, 8, 10) estão desatualizadas.
>
> Para contexto oficial, ver PRD.md e ARCHITECTURE.md.

---

# MyLife — Contexto do Projeto

Este arquivo é a fonte de verdade do projeto. Toda IA, dev ou agente
que for trabalhar neste repositório DEVE ler este documento antes de
implementar qualquer coisa.

---

## 1. O que é o MyLife

MyLife é uma suíte pessoal de organização de vida. Os módulos ativos
atualmente são o Financeiro e a Lista de Mercado. Futuramente virão
Rotina, Estudos, Saúde, Academia, Hábitos e Objetivos.

A arquitetura do projeto é modular e preparada para crescer. A Home é a
entrada autenticada da ferramenta e apresenta o resumo semanal do tempo
de uso da plataforma.

---

## 2. O que o módulo Financeiro É

O MyLife Financeiro é um livro-caixa inteligente. Ele serve para:

- Registrar entradas (receitas) e saídas (despesas)
- Categorizar gastos por tipo e natureza
- Acompanhar o resultado do mês (quanto entrou, quanto saiu, qual o balanço)
- Visualizar gastos por categoria, por responsável, por forma de pagamento
- Controlar compras parceladas (cada parcela é uma transação mensal)
- Acompanhar o status de cada transação (pendente ou concluída)

---

## 3. O que o módulo Financeiro NÃO É

- NÃO é gestão patrimonial
- NÃO controla saldo de conta bancária
- NÃO faz conciliação bancária
- NÃO calcula saldo corrente por conta
- NÃO tem saldo inicial de conta
- NÃO integra com Open Finance
- NÃO tem cálculo de rendimento por conta
- NÃO tem extrato de conta

A tabela contas representa apenas etiquetas de origem/destino do dinheiro
(Nubank, Itaú, Carteira). Ela não tem saldo, cálculo ou movimentação.

---

## 4. Conceitos do domínio

### Household (Família)

Espaço financeiro compartilhado. Todo dado pertence a um household. Um
usuário pode participar de múltiplos households. Cada household tem
membros com papéis: owner, admin, membro.

### Categoria

Classifica cada transação. Tem tipo receita/despesa, natureza
fixo/variavel/investimento/outro, nome, cor e icone.

### Conta

Etiqueta de origem/destino do dinheiro. Tem nome e tipo
conta_corrente/carteira/poupanca/investimento/outro. Sem saldo ou cálculo.

### Responsável

Pessoa ou entidade responsável pela transação. Ex.: Wesley, Gabriella,
Casal, Filho ou Empresa.

### Transação

Cada movimentação financeira tem tipo, valor, data, descrição, observação,
categoria, conta, responsável, forma de pagamento, cartão, parcelamento e
status pendente/concluida.

### Parcelamento

Quando uma compra é parcelada, o sistema cria automaticamente as
transações mensais ligadas ao mesmo parcelamento_id. Cada parcela tem
status individual.

---

## 5. Modelo de dados do Financeiro

Tabelas em public:

- perfis
- households
- household_membros
- categorias
- contas
- responsaveis
- parcelamentos
- transacoes
- lista_mercado_itens

O isolamento de dados usa RLS com a função is_household_member(household_id).

---

## 6. Arquitetura do código

```text
src/
├── app/              -> shell, sidebar, topbar, Home e registro de módulos
├── core/             -> auth, household, perfil e atividade transversal
├── modules/
│   ├── financeiro/  -> pages, components, hooks, services, types e utils
│   └── lista-mercado/ -> pages, components, hooks, services e types
├── components/ui/    -> design system compartilhado
├── lib/              -> supabase, queryClient e env
├── hooks/            -> hooks genéricos
└── utils/            -> formatadores e helpers
```

### Regras invioláveis

1. Nenhum componente chama Supabase diretamente. Banco fica em services/.
2. Nenhum import cruzado entre módulos. Compartilhado vai para core/ ou components/.
3. Isolamento de dados é garantido por RLS. Nunca filtramos por user_id no frontend.
4. Existe um único cliente Supabase em src/lib/supabase.ts.
5. Sem any e sem @ts-ignore.
6. Variáveis de ambiente somente via import.meta.env.VITE_*.
7. Toda feature tem tipo em types/, função em services/, hook em hooks/,
   componente em components/ e página em pages/.

---

## 7. Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (dark theme, paleta MyLife Blue)
- Supabase (Auth + Postgres + RLS)
- TanStack Query
- React Router v6
- React Hook Form + Zod
- Recharts
- Lucide React
- Sonner

---

## 8. Roadmap

- Passos 1 a 4 — Banco, esqueleto, autenticação e Household ✅
- Passo 5 — CRUD de Categorias ✅
- Passos 6 a 10 — Contas, responsáveis, transações, parcelamento,
  dashboard e importação CSV em evolução
- Passo 11 — Gestão de família (convites, papéis)
- Passo 12 — Deploy Netlify
- Passo 13 — Home e Lista de Mercado ⏳ em construção

---

## 9. Home e Lista de Mercado — escopo atual

A Home autenticada fica na rota `/` dentro do AppShell. Ela apresenta
apenas um resumo semanal do tempo que o usuário passou na plataforma,
medido localmente por usuário neste dispositivo.

Lista de Mercado é um módulo independente na rota `/lista-mercado`. Cada
item pertence ao household ativo e tem nome, quantidade, observação e
status pendente ou comprado. A persistência usa a tabela
`lista_mercado_itens` com RLS por household.

---

## 10. Identidade visual

A paleta e tipografia oficiais estão documentadas nos tokens de
tailwind.config.ts e src/styles/globals.css.

Cores principais:

- Fundo: navy-900 (#081224)
- Marca: brand-600 (#2f63f2)
- Texto: content-primary (#f4f7fb)
- Sucesso: state-success (#35b779)
- Erro: state-error (#e86a6a)

Tipografia:

- Display e títulos: Sora
- Corpo: Inter

---

## 11. Como colaborar neste projeto

Antes de qualquer implementação:

1. Leia este arquivo inteiro.
2. Confirme mentalmente o passo atual do roadmap.
3. Não avance para passos futuros sem autorização explícita.
4. Não crie funcionalidades que não foram solicitadas.
5. Não reinterprete o domínio. Se algo parecer ambíguo, pergunte.

O projeto tem um domínio simples e explícito. Não invente complexidade.
