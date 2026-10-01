# PRD — Product Requirements Document

> Documento oficial. Define o que é o produto, para quem, por quê e o que
> ele faz em alto nível. Para detalhes técnicos, ver ARCHITECTURE.md. Para
> regras de trabalho, ver RULES.md. Para roadmap, ver TASK.md.

---

## 1. O que é

MyLife é uma suíte pessoal de organização de vida. Reúne, num só lugar,
as áreas que uma pessoa precisa organizar no dia a dia: finanças, rotina,
estudos, saúde e o que mais fizer sentido para ela.

O produto é construído em módulos. Cada módulo cobre uma área da vida.
Todos os módulos compartilham a mesma base: autenticação, espaço de dados
(pessoal ou familiar) e identidade visual.

---

## 2. Para quem

Público-alvo primário: adultos entre 25 e 40 anos, urbanos, que valorizam
clareza e organização. Pessoas que já sentem a dor de ter informação
espalhada (planilhas, apps soltos, anotações) e querem consolidar.

Uso atual: uma família real (Wesley e Gabriella) usa o módulo Financeiro
no dia a dia. A arquitetura foi preparada desde o início para múltiplos
households, com isolamento de dados por RLS. O produto pode crescer para
outras famílias sem refazer a base.

O usuário pode organizar seus dados em um espaço pessoal sem criar ou
selecionar uma família. Também pode participar de espaços familiares; os
dados de cada espaço permanecem separados.

---

## 3. Por quê

As pessoas organizam a própria vida em pedaços. Finanças numa planilha,
rotina num app de tarefas, saúde num bloco de notas, estudos em outro
lugar. Nada conversa entre si. Nada compartilha contexto.

MyLife resolve isso dando um lugar único para todas essas áreas, com uma
experiência coerente e uma base de dados única.

A promessa em uma frase: "sua vida em ordem, num só lugar".

---

## 4. O que faz

### Módulo Financeiro (ativo)

É um livro-caixa inteligente. Permite:

- Registrar receitas e despesas com data, valor, categoria, conta de
  origem/destino, forma de pagamento e observação
- Categorizar gastos por tipo (receita/despesa) e natureza (fixo,
  variável, investimento, outro)
- Acompanhar o resultado do período (quanto entrou, quanto saiu, balanço)
- Visualizar gastos por categoria, responsável, forma de pagamento e
  instituição
- Controlar compras parceladas (cada parcela vira uma transação mensal
  separada)
- Marcar cada transação como pendente ou concluída
- Importar e exportar transações em CSV
- Compartilhar dados em família com papéis de administração, leitura e
  leitura/escrita; administradores gerenciam membros e permissões

### Módulos futuros (não implementados ainda)

- Rotina
- Estudos
- Saúde
- Academia
- Hábitos
- Objetivos

Nenhum deles está sendo construído agora. Estão previstos na arquitetura
para que possam ser adicionados sem quebrar o que existe.

---

## 5. O que NÃO faz

Esta seção é tão importante quanto a anterior. MyLife Financeiro NÃO:

- É gestão patrimonial
- Controla saldo de conta bancária
- Faz conciliação bancária
- Calcula saldo corrente por conta
- Tem "saldo inicial" de conta
- Integra com Open Finance
- Calcula rendimento por conta
- Mostra extrato de conta

A tabela contas representa apenas etiquetas de origem/destino do dinheiro
(Nubank, Itaú, Carteira). Ela não tem saldo, não tem cálculo, não tem
movimentação.

Qualquer funcionalidade que puxe o produto para o lado de "gestor
patrimonial" está fora de escopo.

---

## 6. Princípios

1. Clareza acima de completude. É melhor ter 5 coisas bem-feitas do que
   20 coisas confusas.

2. Modularidade real. Cada módulo vive isolado. Se um sai, os outros
   continuam funcionando.

3. Segurança desde o primeiro dia. Isolamento de dados por espaço,
   garantido no banco (RLS), não no frontend.

4. Simplicidade no domínio. Não inventar complexidade onde não precisa.
   Conta é etiqueta. Categoria é classificação. Transação é movimentação.

5. Crescer sem reescrever. Novos módulos entram. Novas funcionalidades
   entram. A base permanece.

---

## 7. Como medimos sucesso

Curto prazo (uso pessoal/familiar):
- Wesley e Gabriella usam o Financeiro como fonte de verdade
- Não voltam para a planilha antiga
- Todas as transações do mês estão lançadas e categorizadas

Médio prazo (produto utilizável por outras famílias):
- Outra pessoa consegue criar conta, criar família e usar sem suporte
- Dados de famílias diferentes nunca se misturam
- Onboarding é autoexplicativo (sem manual)

Longo prazo (suíte):
- Mais de um módulo ativo e sendo usado
- Interface coerente entre módulos
- Um usuário novo entende o produto em menos de 5 minutos

---

## 8. Fora de escopo (agora)

- Integração bancária / Open Finance
- Cartão de crédito automático
- IA financeira
- App mobile nativo
- Sistema de planos/pagamentos
- Módulos além do Financeiro
- Multilíngue
- Suporte a múltiplas moedas

Esses itens fazem parte da visão futura do MyLife. Não fazem parte deste
primeiro produto. A arquitetura deve permitir adicioná-los depois sem
reescrever a base.

---

## 9. Documentos relacionados

- ARCHITECTURE.md — como o produto é montado por dentro
- RULES.md — o que pode e o que não pode ser feito no código
- DESIGN.md — identidade visual, tipografia, componentes
- TASK.md — o que está sendo feito agora
- MEMORY.md — decisões, erros e mudanças de rumo registrados
- MAPA_DO_PROJETO.md — raio-X factual do estado atual
