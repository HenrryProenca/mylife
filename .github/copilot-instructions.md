# Instruções para o GitHub Copilot — MyLife

Este arquivo é lido automaticamente em toda interação. Ele aponta para os
documentos oficiais do projeto. Antes de implementar qualquer coisa, leia
os documentos relevantes.

---

## Ordem de leitura obrigatória

Toda interação deve começar por aqui, nesta ordem:

1. PRD.md            — o que é o produto, para quem, o que NÃO é
2. ARCHITECTURE.md   — como o produto é montado
3. RULES.md          — o que pode e o que não pode ser feito
4. DESIGN.md         — identidade visual, paleta, componentes
5. TASK.md           — o que está sendo feito AGORA
6. MEMORY.md         — decisões, erros e mudanças de rumo já registrados

Se o pedido for sobre um módulo específico, consultar também o mapa
(MAPA_DO_PROJETO.md) para entender o estado atual.

---

## Regras que nunca podem ser quebradas

1. Nenhum componente chama supabase diretamente. Sempre via services/.
2. Nenhum import cruzado entre módulos. Compartilhado vai para core/ ou
   components/.
3. Isolamento de dados por RLS. Nunca filtrar por user_id no frontend.
4. Toda feature segue: types/ → services/ → hooks/ → components/ → pages/.
5. Sem any, sem @ts-ignore, sem eslint-disable.
6. Variáveis de ambiente só via import.meta.env.VITE_*.
7. Nunca inventar funcionalidade. Se algo é ambíguo, perguntar.

---

## O que NUNCA fazer

- Criar telas, rotas ou tabelas que não foram pedidas
- Adicionar campos ao banco sem autorização
- Reinterpretar o domínio (achar que "contas" tem saldo, por exemplo)
- Antecipar passos do roadmap
- Instalar dependências sem avisar
- Refatorar arquivos fora da tarefa atual
- Deletar arquivos sem confirmar
- Usar tokens de paleta antigos (navy-*, content-*, brand-400, text-h4)

---

## Comportamento esperado

- Antes de codar: ler TASK.md e confirmar em qual passo estamos.
- Durante: mostrar antes/depois em alterações estruturais.
- Ao terminar: rodar npm run typecheck e reportar.
- Se encontrar ambiguidade: perguntar, não inventar.
- Se algo parecer fora do escopo: apresentar como sugestão, não implementar.

---

## Contexto resumido

MyLife é uma suíte pessoal de organização de vida. O primeiro módulo é o
Financeiro, que é um livro-caixa inteligente (não gestor patrimonial).
Multi-tenant por household, com RLS garantindo isolamento no Postgres.
A paleta oficial é off-white quente com cobalto pastel.

Para detalhes, ler os 6 documentos oficiais na ordem acima.