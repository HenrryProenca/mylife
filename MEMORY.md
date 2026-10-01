# MEMORY — Decisões, erros e mudanças de rumo

> Documento oficial e vivo. Registra o que já foi decidido, o que já deu
> errado e o que mudou de direção. Só entram entradas que mudaram o rumo
> do projeto ou evitam repetição de erro. Não é diário de bordo.

## Como usar este documento

Toda entrada segue este formato:

    [data] — [tipo] — [assunto]
    Contexto: por que essa decisão foi tomada
    Decisão: o que ficou definido
    Impacto: o que muda a partir de agora

Tipos:

- DECISÃO     — escolha que afeta o produto ou o código
- ERRO        — algo que deu errado e não deve se repetir
- MUDANÇA     — alteração de rumo em relação a algo já definido
- APRENDIZADO — insight que vale registrar para o futuro

Regra: cada entrada tem no máximo 5 linhas. Se não couber, é porque não
é memória — é documentação (vai para ARCHITECTURE ou DESIGN).

## 1. Decisões estruturais

### [2026-10] — DECISÃO — Espaço pessoal e papéis familiares
Contexto: o uso não deve depender da criação de uma família; famílias precisam controlar acesso.
Decisão: cada usuário pode usar espaço pessoal isolado; famílias têm owner/admin, membro (leitura/escrita) e visualizador (somente leitura).
Impacto: convites, alteração de papel e remoção são restritos a owner/admin; RLS/RPC impõem as permissões no banco.

### [2026-09] — DECISÃO — Modelo de dados: livro-caixa, não gestor patrimonial

Contexto: o projeto começou como controle financeiro pessoal (FinControl),
e uma IA tentou expandir para gestão de contas com saldo.
Decisão: MyLife Financeiro é livro-caixa. Conta é etiqueta de origem/destino,
sem saldo, sem cálculo, sem conciliação.
Impacto: toda feature que puxe para "gestor patrimonial" está fora de escopo.
A coluna `contas.saldo_inicial` existe no banco mas é morta.

### [2026-09] — DECISÃO — Multi-tenant por household

Contexto: MyLife nasceu para uso familiar (Wesley + Gabriella), mas foi
projetado desde o início para múltiplos usuários.
Decisão: isolamento por `household_id`, garantido por RLS no Postgres.
Impacto: nenhum filtro por `user_id` no frontend. Toda tabela de negócio
tem `household_id` e policy `is_household_member`.

### [2026-09] — DECISÃO — Banco e RLS são fonte de verdade da segurança

Contexto: dados financeiros são sensíveis.
Decisão: nunca confiar no frontend para segurança. RLS bloqueia no banco
mesmo se alguém chamar a API direto.
Impacto: service nunca filtra por `user_id`. A única camada que decide
acesso é a policy de RLS.

### [2026-09] — DECISÃO — Arquitetura modular preparada para o MyLife completo

Contexto: Financeiro é o primeiro módulo de uma suíte que terá Rotina,
Estudos, Saúde etc.
Decisão: cada módulo vive em `src/modules/{nome}/` e é independente.
Nenhum módulo importa de outro.
Impacto: se um módulo sai, os outros continuam funcionando. Novo módulo
entra adicionando um diretório e registrando em `app/modules.ts`.

## 2. Decisões de implementação

### [2026-09] — DECISÃO — Hierarquia de camadas

Contexto: a IA do VS Code uma vez criou queries diretas em componentes.
Decisão: page → hook → service → Supabase. Nunca pular camada.
Impacto: componentes nunca importam `supabase` diretamente. Exceções
documentadas: `AuthProvider`, `RedefinirSenhaPage` e `PerfilPage`.

### [2026-09] — DECISÃO — TanStack Query para todo estado servidor

Contexto: sem isso, cada tela gerenciaria cache manualmente.
Decisão: `useQuery` para ler, `useMutation` para escrever, invalidação
por chave-mãe. Query key sempre inclui `householdId`.
Impacto: nenhum `useEffect` para carregar dados. Nenhum `useState` para
guardar lista de servidor.

### [2026-09] — DECISÃO — Tipos derivados em runtime, não persistidos

Contexto: o banco só conhece `receita`/`despesa`, mas a UI precisa
distinguir `fixo`/`variavel`/`cartao`/`investimento`.
Decisão: o banco guarda `tipo` (`receita` | `despesa`) + `natureza` da
categoria. A UI deriva "tipo real" combinando os dois.
Impacto: dashboard tem função `transactionType()` que faz essa derivação.
Não se adiciona um quinto tipo no banco.

### [2026-09] — DECISÃO — Parcelamento gera N transações mensais

Contexto: queria-se algo parecido com os bancos — a compra em 10x cria
10 lançamentos, um por mês.
Decisão: 1 linha em `parcelamentos` + N linhas em `transacoes`, ligadas
por `parcelamento_id`. Cada parcela tem status individual.
Impacto: usuário só marca cada parcela como paga. Editar valor depois
não recalcula o parcelamento.

### [2026-09] — DECISÃO — Convites por token UUID, aceite via RPC no banco

Contexto: gestão de família (convites + papéis) precisava de um fluxo
seguro, sem expor convites entre households.
Decisão: convites vivem em `household_convites` com `token uuid` gerado
pelo banco e `status` (`pendente`/`aceito`/`cancelado`). Aceitar, recusar
e cancelar passam por RPC (`aceitar_convite`, `cancelar_convite`), não
por `update` direto. RLS bloqueia `update` e `delete` direto na tabela.
Impacto: toda mutação de convite passa por RPC. O front tem um wrapper
`recusarConvite` que chama a mesma RPC `cancelar_convite`.

### [2026-09] — DECISÃO — Home mede tempo de uso via localStorage por usuário

Contexto: a Home autenticada precisava mostrar algo útil sem depender de
dados do banco.
Decisão: `usePlatformTime` mede o tempo de uso no dispositivo e persiste
em `localStorage` sob `mylife:tempo-plataforma:<userId>`, com flush a
cada 60s e em `visibilitychange`. A Home consolida em janela semanal
(segunda a domingo).
Impacto: é uma métrica local, não sincronizada entre dispositivos.

## 3. Erros cometidos (não repetir)

### [2026-09] — ERRO — IA inventou gestão de contas com saldo

Contexto: no meio do desenvolvimento, a IA do VS Code começou a criar
uma tela de contas bancárias com saldo, contrariando o domínio do produto.
Decisão: nenhuma feature entra sem estar no TASK.md. IA não avança de
passo sem autorização.
Impacto: RULES.md tem seção "antes de implementar" com leitura obrigatória.
PRD.md tem seção explícita "o que NÃO é".

### [2026-09] — ERRO — Cadastro redirecionava para /onboarding sem contexto

Contexto: no início, quem criava conta era jogado direto para criar
família, sem poder ver o app antes.
Decisão: criar família virou opcional. Sem família, o usuário entra
normalmente. Cria quando quiser.
Impacto: `HouseholdGuard` não bloqueia. Sidebar mostra "Criar família"
como CTA se não houver.

### [2026-09] — ERRO — SVG do símbolo gerado por vetorizador automático

Contexto: tentou-se criar o símbolo do "M" em SVG via Vectorizer.
O resultado tinha 400+ nós e não correspondia à imagem aprovada.
Decisão: símbolo fica como PNG em alta resolução até decisão contrária.
Impacto: DESIGN.md registra PNG como formato oficial.

### [2026-09] — ERRO — IA misturou paleta antiga em vários componentes

Contexto: a migração para off-white/cobalto pastel foi aplicada só em
parte do código. Vários arquivos ainda usavam tokens antigos (`navy-*`,
`content-*`).
Decisão: paleta antiga é considerada morta.
Impacto: nenhum token `navy-*` ou `content-*` deve ser usado em código
novo. A migração foi concluída nos arquivos ativos.

## 4. Mudanças de rumo

### [2026-09] — MUDANÇA — Paleta visual saiu de dark mode para off-white

Contexto: a identidade inicial era cobalto neon sobre fundo navy escuro.
Aos poucos o produto pediu algo mais calmo.
Decisão: paleta oficial é off-white quente (canvas) + cobalto pastel
(brand) + cinza-azulado escuro (ink).
Impacto: `tailwind.config.ts` foi reescrito. Todos os componentes seguem
os novos tokens.

### [2026-09] — MUDANÇA — Logo deixou de ser símbolo geométrico abstrato

Contexto: tentou-se várias versões de símbolo geométrico (círculo com M,
V empilhado, blocos 3D). Nenhuma agradou.
Decisão: símbolo oficial é um "M" orgânico, suave, em cobalto pastel.
Versão em PNG de alta resolução.
Impacto: favicon e sidebar usam o símbolo. Wordmark continua em Sora.

### [2026-09] — MUDANÇA — O produto ganhou "Home" separada do Financeiro

Contexto: inicialmente `/` redirecionava para `/financeiro`. Depois
decidiu-se que a raiz mostra um resumo geral de uso da plataforma.
Decisão: `/` renderiza `HomePage` com gráfico de tempo de uso.
Impacto: Home é o primeiro contato pós-login. Não é o dashboard financeiro.

### [2026-09] — MUDANÇA — Cadastro passou a logar automaticamente

Contexto: antes, criar conta exigia um segundo passo manual de login, e
o usuário caía em `/login` sem contexto.
Decisão: após `signUp`, a página tenta `loginUsuario` automaticamente.
Se o Supabase exigir confirmação de email, cai em `/login` com toast
informativo e preserva `?redirect=`.
Impacto: fluxo de cadastro tem menos atrito quando o email já está
confirmado.

### [2026-09] — MUDANÇA — Categorias migraram de página própria para modal no dashboard

Contexto: havia `CategoriasPage` com rota própria e `CategoriasManager`
dentro do dashboard — duas UIs para a mesma coisa.
Decisão: só `CategoriasManager` sobrevive, aberto como modal dentro do
`DashboardPage`. Rota `/financeiro/categorias` foi removida.
Impacto: o mapa e a arquitetura não têm mais a rota antiga.

## 5. Aprendizados

### [2026-09] — APRENDIZADO — Documentação estruturada evita desalinhamento

Contexto: o projeto passou por uma fase em que a IA inventou features
e o dev gastou tempo desfazendo. Documentos soltos não bastavam.
Decisão: 6 documentos oficiais (PRD, ARCHITECTURE, RULES, DESIGN, TASK,
MEMORY) + mapa factual. Cada um faz uma coisa bem.
Impacto: toda IA e dev deve ler os 6 antes de implementar.

### [2026-09] — APRENDIZADO — IA acerta pedido pequeno, erra pedido grande

Contexto: pedidos tipo "implementa o módulo financeiro" fizeram a IA
se perder. Pedidos tipo "cria o arquivo X com esse conteúdo" sempre
deram certo.
Decisão: quebrar tudo em tarefas pequenas. Um arquivo por vez.
Impacto: prompts entregam 1 a 3 arquivos, não módulos inteiros.

### [2026-09] — APRENDIZADO — RLS bem escrito não precisa de reforço no front

Contexto: dúvida inicial se era seguro confiar só em RLS.
Decisão: RLS no Postgres é a fonte de verdade. Filtros no frontend são
redundância desnecessária.
Impacto: services nunca passam `user_id`. Não há risco de vazamento
porque o banco bloqueia qualquer acesso fora do household.

### [2026-09] — APRENDIZADO — Documentação oficial desatualiza rápido

Contexto: o mapa do projeto em 2026-09-28 já divergia do código em
vários pontos (pastas, duplicações, paleta) um dia depois.
Decisão: rodar revisão factual do `MAPA_DO_PROJETO.md` sempre que uma
fase fechar, não só quando der vontade.
Impacto: o mapa passa a ser confiável como raio-X do estado atual.

## 6. Documentos relacionados

- PRD.md — o que é o produto
- ARCHITECTURE.md — como o produto é montado
- RULES.md — o que pode e o que não pode
- DESIGN.md — identidade visual
- TASK.md — o que está sendo feito agora
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
