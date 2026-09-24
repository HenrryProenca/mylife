# Instruções para o GitHub Copilot — Projeto MyLife

Este arquivo é lido automaticamente pelo Copilot em toda interação. 
Ele contém o contexto do produto e as regras de trabalho. Siga à risca.

---

## REGRA ZERO — Antes de qualquer implementação

Antes de escrever, alterar ou sugerir qualquer código, você DEVE:

1. Ler o arquivo CONTEXT.md na raiz do projeto (fonte de verdade 
   completa do produto).
2. Confirmar mentalmente em qual passo do roadmap estamos.
3. NÃO avançar para passos futuros sem autorização explícita.
4. NÃO criar funcionalidades que não foram solicitadas.
5. Se algo parecer ambíguo, PERGUNTE antes de inventar.

O projeto já sofreu uma vez com funcionalidades inventadas. Isso não 
pode se repetir.

---

## 1. O que é o MyLife

Suíte pessoal de organização de vida. O primeiro módulo é o Financeiro. 
Outros módulos (Rotina, Estudos, Saúde, etc.) virão depois — mas 
NENHUM deles está sendo implementado agora.

---

## 2. O que o módulo Financeiro É

Um *livro-caixa inteligente*. Registra entradas e saídas, categoriza, 
acompanha resultado do período, controla parcelamentos, mostra status.

---

## 3. O que o módulo Financeiro NÃO É

- ❌ NÃO é gestão patrimonial
- ❌ NÃO controla saldo de conta bancária
- ❌ NÃO faz conciliação bancária
- ❌ NÃO calcula saldo corrente
- ❌ NÃO tem "saldo inicial" de conta
- ❌ NÃO integra com Open Finance

A tabela contas no banco é apenas *etiqueta* (Nubank, Itaú, Carteira). 
Não tem saldo, não tem cálculo, não tem movimentação.

---

## 4. Regras de arquitetura (invioláveis)

1. NENHUM componente chama supabase diretamente. Toda comunicação 
   com o banco fica em services/. Componentes consomem hooks/.

2. Nenhum import cruzado entre módulos. Se algo precisa ser 
   compartilhado, vai para core/ ou components/.

3. Isolamento de dados é garantido por RLS. NUNCA filtramos por 
   user_id no frontend — o banco já bloqueia.

4. Um cliente Supabase único em src/lib/supabase.ts.

5. Sem any. Sem @ts-ignore. Sem // eslint-disable-next-line.

6. Variáveis de ambiente só via import.meta.env.VITE_*.

7. Toda feature tem: tipo em types/, função em services/, hook 
   em hooks/, componente em components/, página em pages/.

---

## 5. Comportamento esperado em cada interação

- *Antes de codar*: leia o CONTEXT.md, confirme o passo atual.
- *Ao implementar*: mostre os arquivos antes/depois de alterações 
  estruturais.
- *Ao terminar*: rode npm run typecheck e reporte o resultado.
- *Ao encontrar ambiguidade*: pergunte, não invente.
- *Ao propor algo fora do escopo*: apresente como sugestão separada, 
  não implemente.

---

## 6. O que NUNCA fazer

- ❌ Criar telas, rotas ou tabelas que não foram pedidas
- ❌ Adicionar campos ao banco sem autorização
- ❌ Reinterpretar o domínio (ex: achar que "contas" tem saldo)
- ❌ Antecipar passos do roadmap
- ❌ Instalar dependências sem avisar
- ❌ Refatorar arquivos que não fazem parte da tarefa atual
- ❌ Deletar arquivos sem confirmar

---

## 7. Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (dark, paleta MyLife Blue)
- Supabase (Auth + Postgres + RLS)
- TanStack Query
- React Router v6
- React Hook Form + Zod
- Recharts
- Lucide React
- Sonner

---

## 8. Estado atual do projeto

Passos 1 a 4 concluídos:
- ✅ Banco de dados (8 tabelas + RLS)
- ✅ Esqueleto do projeto
- ✅ Autenticação completa
- ✅ Household / Família (com exclusão de família)

Passo atual: *Passo 5 — CRUD de Categorias*.

---

## 9. Se você está em dúvida sobre o que fazer

Pergunte. Sempre. É melhor perguntar do que implementar errado e 
desfazer depois.
