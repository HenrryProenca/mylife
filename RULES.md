# RULES — Regras de trabalho do projeto

> Documento oficial. Define o que pode e o que não pode ser feito no
> código, quais bibliotecas usar e como tratar erros. Para arquitetura,
> ver ARCHITECTURE.md. Para o que é o produto, ver PRD.md.

---

## 1. Antes de qualquer implementação

Antes de escrever, alterar ou sugerir qualquer código, é obrigatório:

1. Ler o PRD.md para entender o que é o produto e o que NÃO é
2. Ler o ARCHITECTURE.md para entender a estrutura
3. Confirmar em qual passo do roadmap estamos (TASK.md)
4. Verificar no MEMORY.md se já houve decisão anterior sobre o assunto
5. Se houver ambiguidade, PERGUNTAR antes de implementar

Esta etapa existe porque o projeto já sofreu com funcionalidades
inventadas. Não se repete.

---

## 2. Regras de arquitetura (invioláveis)

1. Nenhum componente chama supabase diretamente. Toda comunicação com
   o banco fica em services/.

2. Nenhum import cruzado entre módulos. Se algo precisa ser
   compartilhado, sobe para core/ ou components/.

3. Isolamento de dados é garantido por RLS. Nunca filtramos por
   user_id no frontend — o banco já bloqueia.

4. Um único cliente Supabase em src/lib/supabase.ts.

5. Sem any. Sem @ts-ignore. Sem eslint-disable.

6. Variáveis de ambiente apenas via import.meta.env.VITE_*.

7. Toda feature segue a hierarquia:
   tipo em types/, função em services/, hook em hooks/, componente em
   components/, página em pages/.

Exceção autorizada: AuthProvider e RedefinirSenhaPage acessam
supabase.auth diretamente. Fora isso, nada.

---

## 3. Bibliotecas autorizadas

O projeto usa exatamente estas. Não adicionar nenhuma sem autorização.

### Já em uso
- @supabase/supabase-js — Auth + Postgres + RLS
- @tanstack/react-query — cache e estado servidor
- react-router-dom — roteamento
- react-hook-form — formulários
- zod — validação de schema
- recharts — gráficos
- lucide-react — ícones
- sonner — notificações
- date-fns — manipulação de datas
- tailwindcss — estilos

### Não usar
- Bibliotecas de UI pesadas (Material UI, Ant Design, Chakra, Mantine)
- Gerenciadores de estado global (Redux, MobX, Jotai) — Zustand pode
  ser usado só se for realmente necessário
- Bibliotecas de data alternativas (Moment, Dayjs)
- Bibliotecas de gráfico alternativas (Chart.js direto, Victory)
- CSS-in-JS (styled-components, emotion)

Para adicionar qualquer dependência nova, perguntar antes.

---

## 4. Padrões de código

### Nomenclatura
- Componentes: PascalCase (CategoriaForm.tsx)
- Hooks: camelCase com prefixo use (useCategorias.ts)
- Services: kebab-case com sufixo .service (categorias.service.ts)
- Tipos: PascalCase, arquivo com sufixo .types (categorias.types.ts)
- Constantes globais: SCREAMING_SNAKE_CASE

### Idioma
- Código (variáveis, funções, tipos): português quando é do domínio,
  inglês quando é técnico genérico
- Labels e mensagens de UI: português
- Comentários: português, só quando o código não é autoexplicativo
- Commits: português

### Estrutura de arquivos
- Um componente por arquivo
- Um hook por arquivo
- Um service pode ter várias funções relacionadas
- Types agrupados por domínio

### TypeScript
- Strict mode ligado
- Preferir tipos a interfaces quando for união ou primitivo
- Preferir interfaces a tipos quando for objeto extensível
- Nunca usar `unknown` sem estreitar antes

### React
- Componentes funcionais com hooks
- Sem `useEffect` para dados (usar React Query)
- Sem estado global desnecessário
- Props tipadas explicitamente, sem default props

---

## 5. Tratamento de erro

### No service
- Lançar erro com `throw error` direto do Supabase
- Não traduzir a mensagem (quem traduz é quem exibe)

### No hook
- Se for query: o erro fica em `error` do React Query
- Se for mutation: o erro é lançado para o caller
- Nunca engolir erro com try/catch vazio

### No componente
- Envolver chamadas em try/catch
- Mostrar toast em português com mensagem clara
- Nunca mostrar erro técnico do Supabase para o usuário

### Padrão de mensagem
- Erros de validação: "Informe X"
- Erros de permissão: "Você não tem permissão para X"
- Erros de rede: "Erro de conexão. Tente novamente."
- Erros desconhecidos: mensagem genérica + console.error

---

## 6. Segurança

1. Nenhum dado financeiro depende só do frontend para estar protegido.
   Sempre RLS.

2. Nunca logar valores de transação, saldo ou dado sensível em console
   de produção.

3. Nunca colocar chaves (service_role, secret) no frontend. Só
   VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.

4. Nunca confiar em input do usuário sem validação Zod.

5. Nunca montar query string direto com input do usuário.

---

## 7. Comportamento esperado ao implementar

### Antes de codar
- Confirmar em qual passo do roadmap estamos
- Confirmar que a feature está dentro do escopo do PRD
- Confirmar que segue a arquitetura do ARCHITECTURE.md

### Durante
- Mostrar arquivos antes/depois em alterações estruturais
- Não refatorar arquivos que não fazem parte da tarefa
- Não adicionar dependência sem avisar

### Depois
- Rodar `npm run typecheck`
- Rodar `npm run dev` e confirmar que sobe
- Rodar `npm run build` antes de commit grande
- Reportar resultado

---

## 8. O que NUNCA fazer

- Criar telas, rotas ou tabelas não solicitadas
- Adicionar campos ao banco sem autorização
- Reinterpretar o domínio (achar que "contas" tem saldo, por exemplo)
- Antecipar passos do roadmap
- Instalar dependências sem avisar
- Refatorar arquivos fora da tarefa atual
- Deletar arquivos sem confirmar
- Fazer commit direto na main sem revisar
- Usar `console.log` em código que vai para produção
- Deixar `any`, `@ts-ignore` ou `eslint-disable` no código

---

## 9. Se estiver em dúvida

Pergunte. Sempre. É melhor perguntar do que implementar errado e
desfazer depois.

---

## 10. Documentos relacionados

- PRD.md — o que é o produto
- ARCHITECTURE.md — como o produto é montado
- DESIGN.md — identidade visual e componentes
- TASK.md — o que está sendo feito agora
- MEMORY.md — decisões, erros e mudanças de rumo
- MAPA_DO_PROJETO.md — raio-X factual do estado atual