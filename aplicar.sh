#!/usr/bin/env bash

# ============================================================
# Bloco C — Remover saldo_inicial do schema.sql
# ============================================================
# O que este script faz:
# - Remove a linha "saldo_inicial numeric(14,2) not null default 0,"
#   da definição da tabela contas em supabase/schema.sql
#
# ⚠️ IMPORTANTE: este script só altera o arquivo local.
# Depois de rodar, você precisa rodar no Supabase SQL Editor:
#
#   ALTER TABLE public.contas DROP COLUMN IF EXISTS saldo_inicial;
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - supabase/schema.sql (sobrescrito)
# ============================================================

set -e

# --- supabase/schema.sql ---
cat << 'EOF' > supabase/schema.sql
-- ============================================================================
-- MYLIFE — Módulo Financeiro — Schema inicial
-- ============================================================================
-- Ordem: extensões → tabelas → índices → funções auxiliares → triggers → RLS
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PERFIS
-- ============================================================================
create table if not exists public.perfis (
  id           uuid primary key references auth.users(id) on delete cascade,
  nome         text not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.perfis is 'Espelho 1:1 de auth.users, com dados de negócio.';

-- ============================================================================
-- 2. HOUSEHOLDS
-- ============================================================================
create table if not exists public.households (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null check (length(trim(nome)) > 0),
  created_by   uuid not null references public.perfis(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.households is 'Família / grupo financeiro.';

-- ============================================================================
-- 3. HOUSEHOLD_MEMBROS
-- ============================================================================
create table if not exists public.household_membros (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  user_id        uuid not null references public.perfis(id) on delete cascade,
  papel          text not null default 'membro'
                 check (papel in ('owner','admin','membro')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (household_id, user_id)
);

comment on table public.household_membros is 'Relação N:N entre usuários e households.';

-- ============================================================================
-- 4. CATEGORIAS
-- ============================================================================
create table if not exists public.categorias (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  nome           text not null check (length(trim(nome)) > 0),
  tipo           text not null check (tipo in ('receita','despesa')),
  natureza       text not null default 'outro'
                 check (natureza in ('fixo','variavel','investimento','outro')),
  cor            text,
  icone          text,
  ativa          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (household_id, nome, tipo)
);

comment on table public.categorias is 'Categorias por household. tipo=receita|despesa; natureza=fixo|variavel|investimento|outro.';

-- ============================================================================
-- 5. CONTAS
-- ============================================================================
create table if not exists public.contas (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  nome           text not null check (length(trim(nome)) > 0),
  tipo           text not null default 'conta_corrente'
                 check (tipo in ('conta_corrente','poupanca','carteira','investimento','outro')),
  instituicao    text,
  ativa          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.contas is 'Contas financeiras do household (etiquetas de origem/destino, sem saldo).';

-- ============================================================================
-- 6. RESPONSAVEIS
-- ============================================================================
create table if not exists public.responsaveis (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  nome           text not null check (length(trim(nome)) > 0),
  user_id        uuid references public.perfis(id) on delete set null,
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (household_id, nome)
);

comment on table public.responsaveis is 'Responsáveis por movimentações (pode ou não ser um usuário).';

-- ============================================================================
-- 7. PARCELAMENTOS
-- ============================================================================
create table if not exists public.parcelamentos (
  id                     uuid primary key default gen_random_uuid(),
  household_id           uuid not null references public.households(id) on delete cascade,
  descricao              text not null check (length(trim(descricao)) > 0),
  valor_total            numeric(14,2) not null check (valor_total > 0),
  valor_parcela          numeric(14,2) not null check (valor_parcela > 0),
  total_parcelas         integer not null check (total_parcelas >= 2),
  data_primeira_parcela  date not null,
  categoria_id           uuid references public.categorias(id) on delete set null,
  conta_id               uuid references public.contas(id) on delete set null,
  responsavel_id         uuid references public.responsaveis(id) on delete set null,
  forma_pagamento        text,
  observacao             text,
  created_by             uuid not null references public.perfis(id) on delete restrict,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.parcelamentos is 'Agrupador de compras parceladas. Cada parcela vira uma linha em transacoes.';

-- ============================================================================
-- 8. TRANSACOES
-- ============================================================================
create table if not exists public.transacoes (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households(id) on delete cascade,
  tipo              text not null check (tipo in ('receita','despesa')),
  valor             numeric(14,2) not null check (valor > 0),
  data              date not null,
  descricao         text not null check (length(trim(descricao)) > 0),
  observacao        text,

  categoria_id      uuid references public.categorias(id) on delete set null,
  conta_id          uuid references public.contas(id) on delete set null,
  responsavel_id    uuid references public.responsaveis(id) on delete set null,

  forma_pagamento   text,
  tipo_no_cartao    text check (tipo_no_cartao in ('avista','parcelado') or tipo_no_cartao is null),

  -- Parcelamento
  parcelamento_id   uuid references public.parcelamentos(id) on delete cascade,
  parcela_atual     integer check (parcela_atual is null or parcela_atual > 0),
  parcela_total     integer check (parcela_total is null or parcela_total > 0),

  status            text not null default 'pendente'
                    check (status in ('pendente','concluida')),

  created_by        uuid not null references public.perfis(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint chk_parcela_coerente check (
    (parcelamento_id is null and parcela_atual is null and parcela_total is null)
    or
    (parcelamento_id is not null and parcela_atual is not null and parcela_total is not null
     and parcela_atual between 1 and parcela_total)
  )
);

comment on table public.transacoes is 'Movimentações. Quando parcelada, cada parcela é uma linha com parcelamento_id.';

-- ============================================================================
-- 9. LISTA DE MERCADO
-- ============================================================================
create table if not exists public.lista_mercado_itens (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  nome           text not null check (length(trim(nome)) > 0),
  quantidade     text,
  observacao     text,
  status         text not null default 'pendente'
                 check (status in ('pendente','comprado')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.lista_mercado_itens is 'Itens da lista de mercado por household.';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
create index if not exists idx_transacoes_household_data        on public.transacoes (household_id, data desc);
create index if not exists idx_transacoes_household_tipo        on public.transacoes (household_id, tipo);
create index if not exists idx_transacoes_household_categoria   on public.transacoes (household_id, categoria_id);
create index if not exists idx_transacoes_household_conta       on public.transacoes (household_id, conta_id);
create index if not exists idx_transacoes_household_responsavel on public.transacoes (household_id, responsavel_id);
create index if not exists idx_transacoes_household_status      on public.transacoes (household_id, status);
create index if not exists idx_transacoes_parcelamento          on public.transacoes (parcelamento_id);

create index if not exists idx_household_membros_user           on public.household_membros (user_id);
create index if not exists idx_household_membros_household      on public.household_membros (household_id);

create index if not exists idx_categorias_household             on public.categorias (household_id, tipo);
create index if not exists idx_contas_household                 on public.contas (household_id);
create index if not exists idx_responsaveis_household           on public.responsaveis (household_id);
create index if not exists idx_parcelamentos_household          on public.parcelamentos (household_id);
create index if not exists idx_lista_mercado_household_status   on public.lista_mercado_itens (household_id, status);

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'perfis','households','household_membros','categorias',
      'contas','responsaveis','parcelamentos','transacoes','lista_mercado_itens'
    ])
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I;', t, t);
    execute format(
      'create trigger trg_%I_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;

-- ============================================================================
-- TRIGGER: cria perfil automaticamente quando um usuário se cadastra
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- FUNÇÃO AUXILIAR PARA RLS
-- ============================================================================
create or replace function public.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_membros
    where household_id = h
      and user_id = auth.uid()
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.perfis              enable row level security;
alter table public.households          enable row level security;
alter table public.household_membros   enable row level security;
alter table public.categorias          enable row level security;
alter table public.contas              enable row level security;
alter table public.responsaveis        enable row level security;
alter table public.parcelamentos       enable row level security;
alter table public.transacoes          enable row level security;
alter table public.lista_mercado_itens enable row level security;

-- ---------- PERFIS ----------
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.household_membros hm1
      join public.household_membros hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid() and hm2.user_id = perfis.id
    )
  );

drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- HOUSEHOLDS ----------
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (
    (select auth.uid()) = created_by
    or public.is_household_member(id)
  );

drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert to authenticated
  with check ( (select auth.uid()) = created_by );

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update to authenticated
  using ( public.is_household_member(id) )
  with check ( public.is_household_member(id) );

drop policy if exists households_delete on public.households;
create policy households_delete on public.households
  for delete to authenticated
  using (
    exists (
      select 1 from public.household_membros
      where household_id = households.id
        and user_id = auth.uid()
        and papel = 'owner'
    )
  );

-- ---------- HOUSEHOLD_MEMBROS ----------
drop policy if exists membros_select on public.household_membros;
create policy membros_select on public.household_membros
  for select to authenticated
  using ( user_id = auth.uid() or public.is_household_member(household_id) );

drop policy if exists membros_insert on public.household_membros;
create policy membros_insert on public.household_membros
  for insert to authenticated
  with check (
    exists (
      select 1 from public.household_membros
      where household_id = household_membros.household_id
        and user_id = auth.uid()
        and papel in ('owner','admin')
    )
    or user_id = auth.uid()
  );

drop policy if exists membros_update on public.household_membros;
create policy membros_update on public.household_membros
  for update to authenticated
  using (
    exists (
      select 1 from public.household_membros m2
      where m2.household_id = household_membros.household_id
        and m2.user_id = auth.uid()
        and m2.papel in ('owner','admin')
    )
  )
  with check ( true );

drop policy if exists membros_delete on public.household_membros;
create policy membros_delete on public.household_membros
  for delete to authenticated
  using (
    exists (
      select 1 from public.household_membros m2
      where m2.household_id = household_membros.household_id
        and m2.user_id = auth.uid()
        and m2.papel = 'owner'
    )
    or user_id = auth.uid()
  );

-- ---------- CATEGORIAS ----------
drop policy if exists categorias_all on public.categorias;
create policy categorias_all on public.categorias
  for all to authenticated
  using ( public.is_household_member(household_id) )
  with check ( public.is_household_member(household_id) );

-- ---------- CONTAS ----------
drop policy if exists contas_all on public.contas;
create policy contas_all on public.contas
  for all to authenticated
  using ( public.is_household_member(household_id) )
  with check ( public.is_household_member(household_id) );

-- ---------- RESPONSAVEIS ----------
drop policy if exists responsaveis_all on public.responsaveis;
create policy responsaveis_all on public.responsaveis
  for all to authenticated
  using ( public.is_household_member(household_id) )
  with check ( public.is_household_member(household_id) );

-- ---------- PARCELAMENTOS ----------
drop policy if exists parcelamentos_all on public.parcelamentos;
create policy parcelamentos_all on public.parcelamentos
  for all to authenticated
  using ( public.is_household_member(household_id) )
  with check ( public.is_household_member(household_id) );

-- ---------- TRANSACOES ----------
drop policy if exists transacoes_all on public.transacoes;
create policy transacoes_all on public.transacoes
  for all to authenticated
  using ( public.is_household_member(household_id) )
  with check ( public.is_household_member(household_id) );

-- ---------- LISTA DE MERCADO ----------
drop policy if exists lista_mercado_itens_all on public.lista_mercado_itens;
create policy lista_mercado_itens_all on public.lista_mercado_itens
  for all to authenticated
  using ( public.is_household_member(household_id) )
  with check ( public.is_household_member(household_id) );

-- ============================================================================
-- GRANTS
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant execute on function public.is_household_member(uuid) to authenticated;

-- ============================================================================
-- FIM
-- ============================================================================
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "⚠️  ATENÇÃO: além deste script, você precisa rodar no Supabase SQL Editor:"
echo ""
echo "    ALTER TABLE public.contas DROP COLUMN IF EXISTS saldo_inicial;"
echo ""
echo "Próximos passos:"
echo "  1. git diff                              (confere as mudanças)"
echo "  2. Rodar o SQL acima no Supabase"
echo "  3. git add . && git commit -m \"chore: remove coluna saldo_inicial do schema.sql\" && git push"
echo ""
