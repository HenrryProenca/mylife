# MyLife — Contexto do Projeto

Este arquivo é a fonte de verdade do projeto. Toda IA, dev ou agente 
que for trabalhar neste repositório DEVE ler este documento antes de 
implementar qualquer coisa.

---

## 1. O que é o MyLife

MyLife é uma suíte pessoal de organização de vida. O primeiro módulo 
a ser construído é o *Financeiro*. Futuramente virão Rotina, Estudos, 
Saúde, Academia, Hábitos e Objetivos — mas NENHUM deles está sendo 
implementado agora.

A arquitetura do projeto é modular e preparada para crescer, mas o 
único módulo ativo hoje é o Financeiro.

---

## 2. O que o módulo Financeiro É

O MyLife Financeiro é um *livro-caixa inteligente*. Ele serve para:

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
- NÃO tem "saldo inicial" de conta
- NÃO integra com Open Finance
- NÃO tem cálculo de rendimento por conta
- NÃO tem extrato de conta

*Atenção:* a tabela contas no banco representa apenas *etiquetas* 
para saber "de onde saiu o dinheiro" (Nubank, Itaú, Carteira). Ela não 
tem saldo, não tem cálculo, não tem movimentação.

---

## 4. Conceitos do domínio

*Household (Família)*
Espaço financeiro compartilhado. Todo dado pertence a um household. 
Um usuário pode participar de múltiplos households. Cada household 
tem membros com papéis: owner, admin, membro.

*Categoria*
Classifica cada transação. Tem:
- tipo: receita | despesa
- natureza: fixo | variavel | investimento | outro
- nome, cor, icone

Exemplos:
- Salário → tipo=receita, natureza=outro
- Aluguel → tipo=despesa, natureza=fixo
- Supermercado → tipo=despesa, natureza=variavel
- Tesouro Direto → tipo=despesa, natureza=investimento

*Conta*
Etiqueta de origem/destino do dinheiro. Apenas o nome (Nubank, Itaú) 
e um tipo (conta_corrente, carteira, poupanca, investimento, outro). 
SEM SALDO, SEM CÁLCULO.

*Responsável*
Pessoa ou entidade responsável pela transação. Ex: Wesley, Gabriella, 
Casal, Filho, Empresa.

*Transação*
Cada movimentação financeira. Tem:
- tipo: receita | despesa
- valor
- data
- descrição
- observação
- categoria_id
- conta_id
- responsavel_id
- forma_pagamento (Pix, Cartão de Crédito, Boleto, Dinheiro...)
- tipo_no_cartao: avista | parcelado (só para gastos no cartão)
- parcela_atual, parcela_total (só para parcelados)
- status: pendente | concluida
- parcelamento_id (agrupador quando é parcela)

*Parcelamento*
Quando o usuário compra algo no cartão em 10x, o sistema cria 
automaticamente *10 transações*, uma por mês, todas ligadas ao 
mesmo parcelamento_id. Cada parcela fica com status individual. 
O usuário só marca cada uma como "concluída" quando paga.

---

## 5. Modelo de dados (já implementado no Supabase)

Tabelas em public:
- perfis — espelho 1:1 de auth.users
- households — família/grupo
- household_membros — N:N usuário × household, com papel
- categorias — categorias por household
- contas — etiquetas de conta (SEM SALDO)
- responsaveis — pessoas/entidades responsáveis
- parcelamentos — agrupador de compras parceladas
- transacoes — movimentações

Isolamento de dados via *RLS (Row Level Security)*: toda tabela de 
negócio tem policy is_household_member(household_id).

---

## 6. Arquitetura do código
src/
├── app/ → shell, sidebar, topbar, registry de módulos
├── core/ → auth, household, perfil (transversal)
├── modules/
│ └── financeiro/
│ ├── pages/
│ ├── components/
│ ├── hooks/
│ ├── services/
│ ├── types/
│ └── utils/
├── components/
│ └── ui/ → design system compartilhado
├── lib/ → supabase, queryClient, env
├── hooks/ → hooks genéricos
└── utils/ → formatadores, helpers

text

### Regras invioláveis

1. NENHUM componente chama supabase diretamente. Toda comunicação 
   com o banco fica em services/. Componentes consomem hooks/.

2. Nenhum import cruzado entre módulos. Se algo precisa ser 
   compartilhado, vai para core/ ou components/.

3. Isolamento de dados é garantido por RLS. NUNCA filtramos por 
   user_id no frontend — o banco já bloqueia.

4. Um cliente Supabase único em src/lib/supabase.ts.

5. Sem any. Sem @ts-ignore.

6. Variáveis de ambiente só via import.meta.env.VITE_*.

7. Toda feature tem: tipo em types/, função em services/, hook 
   em hooks/, componente em components/, página em pages/.

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

- Passo 1 — Banco de dados ✅
- Passo 2 — Esqueleto do projeto ✅
- Passo 3 — Autenticação ✅
- Passo 4 — Household / Família ✅ (com exclusão de família)
- Passo 5 — CRUD de Categorias ⏳ *estamos aqui*
- Passo 6 — CRUD de Contas e Responsáveis
- Passo 7 — Transações (versão simples)
- Passo 8 — Parcelamento (cria N transações)
- Passo 9 — Dashboard e gráficos
- Passo 10 — Importação CSV
- Passo 11 — Gestão de família (convites, papéis)
- Passo 12 — Deploy Netlify

---

## 9. Passo 5 — O que está sendo construído AGORA

CRUD de *Categorias*. Nada além disso.

Entrega esperada:
- Página /financeiro/categorias
- Lista de categorias separadas por tipo (receitas / despesas)
- Criar, editar, excluir categoria
- Cada categoria tem: nome, tipo, natureza, cor, ícone
- Seed automático de categorias padrão ao criar a família

O que *NÃO* faz parte do Passo 5:
- ❌ Criar tela de contas com saldo
- ❌ Criar cálculo de saldo
- ❌ Criar conciliação bancária
- ❌ Criar transações
- ❌ Criar dashboard

---

## 10. Identidade visual

A paleta e tipografia oficiais estão documentadas no manual de marca 
(pasta /docs ou equivalente, se existir). Os tokens já estão 
aplicados em tailwind.config.ts e src/styles/globals.css.

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

1. *Leia este arquivo inteiro.*
2. *Confirme com o usuário* que entendeu o passo atual.
3. *Não avance para o próximo passo* sem autorização.
4. *Não crie funcionalidades não solicitadas.*
5. *Não reinterprete o domínio.* Se algo parece ambíguo, PERGUNTE.

Se você é uma IA lendo isso: leia de novo. O projeto é simples. 
Não invente complexidade.
