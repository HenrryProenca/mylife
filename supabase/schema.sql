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

comment on table public.households is 'Família / grupo financeiro. Inclui o household pessoal de cada usuário.';

-- ============================================================================
-- 3. HOUSEHOLD_MEMBROS
-- ============================================================================
create table if not exists public.household_membros (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  user_id        uuid not null references public.perfis(id) on delete cascade,
  papel          text not null default 'membro'
                 check (papel in ('owner','admin','membro','visualizador')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (household_id, user_id)
);

comment on table public.household_membros is 'Relação N:N entre usuários e households.';

alter table public.household_membros
  drop constraint if exists household_membros_papel_check;
alter table public.household_membros
  add constraint household_membros_papel_check
  check (papel in ('owner', 'admin', 'membro', 'visualizador'));

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
  unique (household_id, nome, tipo, natureza)
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
  updated_at     timestamptz not null default now()
);

create unique index if not exists responsaveis_household_user_unique
  on public.responsaveis (household_id, user_id)
  where user_id is not null;

comment on table public.responsaveis is 'Responsáveis das movimentações, associados aos membros do household e mantidos para preservar o histórico.';

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
-- 9. HOUSEHOLD_CONVITES
-- ============================================================================
create table if not exists public.household_convites (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households(id) on delete cascade,
  email_convidado   text not null check (length(trim(email_convidado)) > 0),
  convidado_por     uuid not null references public.perfis(id) on delete restrict,
  papel             text not null default 'membro'
                    check (papel in ('admin','membro','visualizador')),
  status            text not null default 'pendente'
                    check (status in ('pendente','aceito','cancelado')),
  token             uuid not null default gen_random_uuid() unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.household_convites is 'Convites pendentes para um household.';

create unique index if not exists uniq_convite_pendente
  on public.household_convites (household_id, email_convidado)
  where status = 'pendente';

alter table public.household_convites
  drop constraint if exists household_convites_papel_check;
alter table public.household_convites
  add constraint household_convites_papel_check
  check (papel in ('admin', 'membro', 'visualizador'));

-- ============================================================================
-- 10. LISTA DE MERCADO
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

create index if not exists idx_convites_household on public.household_convites (household_id, status);
create index if not exists idx_convites_email     on public.household_convites (email_convidado, status);
create index if not exists idx_convites_token     on public.household_convites (token);

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
      'contas','responsaveis','parcelamentos','transacoes',
      'household_convites','lista_mercado_itens'
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
-- TRIGGER: cria perfil + household pessoal no cadastro
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome           text;
  v_primeiro_nome  text;
  v_household_id   uuid;
begin
  v_nome := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
  v_primeiro_nome := split_part(v_nome, ' ', 1);

  insert into public.perfis (id, nome, avatar_url)
  values (
    new.id,
    v_nome,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.households (nome, created_by)
  values (v_primeiro_nome || ' (pessoal)', new.id)
  returning id into v_household_id;

  insert into public.household_membros (household_id, user_id, papel)
  values (v_household_id, new.id, 'owner')
  on conflict (household_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_responsavel_household_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.responsaveis (household_id, user_id, nome, ativo)
  select new.household_id, new.user_id, coalesce(nullif(trim(p.nome), ''), 'Membro'), true
  from public.perfis p
  where p.id = new.user_id
  on conflict (household_id, user_id) where user_id is not null
  do update set nome = excluded.nome, ativo = true;
  return new;
end;
$$;

drop trigger if exists trg_household_member_responsavel on public.household_membros;
create trigger trg_household_member_responsavel
  after insert or update on public.household_membros
  for each row execute function public.sync_responsavel_household_member();

create or replace function public.sync_responsavel_perfil_nome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.responsaveis
  set nome = coalesce(nullif(trim(new.nome), ''), 'Membro'), ativo = true
  where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_perfil_nome_responsavel on public.perfis;
create trigger trg_perfil_nome_responsavel
  after update of nome on public.perfis
  for each row when (old.nome is distinct from new.nome)
  execute function public.sync_responsavel_perfil_nome();

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
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.pode_escrever_household(h uuid)
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
      and user_id = (select auth.uid())
      and papel in ('owner', 'admin', 'membro')
  );
$$;

create or replace function public.pode_gerenciar_household(h uuid)
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
      and user_id = (select auth.uid())
      and papel in ('owner', 'admin')
  );
$$;

-- ============================================================================
-- RPC: aceitar_convite
-- ============================================================================
create or replace function public.aceitar_convite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convite        record;
  v_user_id        uuid := auth.uid();
  v_user_email     text;
  v_membership_id  uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select email into v_user_email
  from auth.users
  where id = v_user_id;

  if v_user_email is null then
    raise exception 'Não foi possível identificar o email do usuário.';
  end if;

  select * into v_convite
  from public.household_convites
  where token = p_token
    and status = 'pendente'
  for update;

  if not found then
    raise exception 'Convite não encontrado, já aceito ou cancelado.';
  end if;

  if lower(v_convite.email_convidado) <> lower(v_user_email) then
    raise exception 'Este convite foi enviado para outro email.';
  end if;

  if exists (
    select 1 from public.household_membros
    where household_id = v_convite.household_id
      and user_id = v_user_id
  ) then
    raise exception 'Você já é membro desta família.';
  end if;

  insert into public.household_membros (household_id, user_id, papel)
  values (v_convite.household_id, v_user_id, v_convite.papel)
  returning id into v_membership_id;

  update public.household_convites
  set status = 'aceito'
  where id = v_convite.id;

  return jsonb_build_object(
    'household_id', v_convite.household_id,
    'membership_id', v_membership_id,
    'papel', v_convite.papel
  );
end;
$$;

-- ============================================================================
-- RPC: cancelar_convite
-- ============================================================================
create or replace function public.cancelar_convite(p_convite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_household_id  uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select household_id into v_household_id
  from public.household_convites
  where id = p_convite_id
    and status = 'pendente';

  if v_household_id is null then
    raise exception 'Convite não encontrado ou já finalizado.';
  end if;

  if not exists (
    select 1 from public.household_membros
    where household_id = v_household_id
      and user_id = v_user_id
      and papel in ('owner','admin')
  ) then
    raise exception 'Você não tem permissão para cancelar este convite.';
  end if;

  update public.household_convites
  set status = 'cancelado'
  where id = p_convite_id;
end;
$$;

-- ============================================================================
-- RPC: remover_membro_household
-- ============================================================================
create or replace function public.remover_membro_household(p_membro_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_household_id  uuid;
  v_membro_user_id uuid;
  v_membro_papel  text;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select household_id, user_id, papel
  into v_household_id, v_membro_user_id, v_membro_papel
  from public.household_membros
  where id = p_membro_id
  for update;

  if not found then
    raise exception 'Membro não encontrado nesta família.';
  end if;

  if v_membro_papel = 'owner' then
    raise exception 'O dono da família não pode ser removido.';
  end if;

  if v_membro_user_id = v_user_id then
    raise exception 'Você não pode remover seu próprio acesso por esta opção.';
  end if;

  if not exists (
    select 1 from public.household_membros
    where household_id = v_household_id
      and user_id = v_user_id
      and papel in ('owner', 'admin')
  ) then
    raise exception 'Você não tem permissão para remover membros desta família.';
  end if;

  delete from public.household_membros
  where id = p_membro_id;
end;
$$;

-- ============================================================================
-- RPC: alterar_papel_membro_household
-- ============================================================================
create or replace function public.alterar_papel_membro_household(
  p_membro_id uuid,
  p_papel text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id        uuid := auth.uid();
  v_household_id   uuid;
  v_membro_user_id uuid;
  v_membro_papel   text;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_papel not in ('admin', 'membro', 'visualizador') then
    raise exception 'Permissão inválida.';
  end if;

  select household_id, user_id, papel
  into v_household_id, v_membro_user_id, v_membro_papel
  from public.household_membros
  where id = p_membro_id
  for update;

  if not found then
    raise exception 'Membro não encontrado nesta família.';
  end if;

  if not public.pode_gerenciar_household(v_household_id) then
    raise exception 'Você não tem permissão para alterar o acesso desta família.';
  end if;

  if v_membro_papel = 'owner' or v_membro_user_id = v_user_id then
    raise exception 'O acesso do dono e o seu próprio acesso não podem ser alterados por esta opção.';
  end if;

  update public.household_membros
  set papel = p_papel
  where id = p_membro_id;
end;
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
alter table public.household_convites  enable row level security;
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
  using ( public.pode_gerenciar_household(id) )
  with check ( public.pode_gerenciar_household(id) );

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
      select 1 from public.households
      where id = household_membros.household_id
        and created_by = (select auth.uid())
        and household_membros.user_id = (select auth.uid())
        and household_membros.papel = 'owner'
    )
  );

drop policy if exists membros_update on public.household_membros;
create policy membros_update on public.household_membros
  for update to authenticated
  using ( false )
  with check ( false );

drop policy if exists membros_delete on public.household_membros;
create policy membros_delete on public.household_membros
  for delete to authenticated
  using (false);

-- ---------- CATEGORIAS ----------
drop policy if exists categorias_all on public.categorias;
drop policy if exists categorias_select on public.categorias;
drop policy if exists categorias_insert on public.categorias;
drop policy if exists categorias_update on public.categorias;
drop policy if exists categorias_delete on public.categorias;
create policy categorias_select on public.categorias for select to authenticated
  using (public.is_household_member(household_id));
create policy categorias_insert on public.categorias for insert to authenticated
  with check (public.pode_escrever_household(household_id));
create policy categorias_update on public.categorias for update to authenticated
  using (public.pode_escrever_household(household_id))
  with check (public.pode_escrever_household(household_id));
create policy categorias_delete on public.categorias for delete to authenticated
  using (public.pode_escrever_household(household_id));

-- ---------- CONTAS ----------
drop policy if exists contas_all on public.contas;
drop policy if exists contas_select on public.contas;
drop policy if exists contas_insert on public.contas;
drop policy if exists contas_update on public.contas;
drop policy if exists contas_delete on public.contas;
create policy contas_select on public.contas for select to authenticated
  using (public.is_household_member(household_id));
create policy contas_insert on public.contas for insert to authenticated
  with check (public.pode_escrever_household(household_id));
create policy contas_update on public.contas for update to authenticated
  using (public.pode_escrever_household(household_id))
  with check (public.pode_escrever_household(household_id));
create policy contas_delete on public.contas for delete to authenticated
  using (public.pode_escrever_household(household_id));

-- ---------- RESPONSAVEIS ----------
drop policy if exists responsaveis_all on public.responsaveis;
drop policy if exists responsaveis_select on public.responsaveis;
drop policy if exists responsaveis_insert on public.responsaveis;
drop policy if exists responsaveis_update on public.responsaveis;
drop policy if exists responsaveis_delete on public.responsaveis;
create policy responsaveis_select on public.responsaveis for select to authenticated
  using (public.is_household_member(household_id));
create policy responsaveis_insert on public.responsaveis for insert to authenticated
  with check (public.pode_escrever_household(household_id));
create policy responsaveis_update on public.responsaveis for update to authenticated
  using (public.pode_escrever_household(household_id))
  with check (public.pode_escrever_household(household_id));
create policy responsaveis_delete on public.responsaveis for delete to authenticated
  using (public.pode_escrever_household(household_id));

-- ---------- PARCELAMENTOS ----------
drop policy if exists parcelamentos_all on public.parcelamentos;
drop policy if exists parcelamentos_select on public.parcelamentos;
drop policy if exists parcelamentos_insert on public.parcelamentos;
drop policy if exists parcelamentos_update on public.parcelamentos;
drop policy if exists parcelamentos_delete on public.parcelamentos;
create policy parcelamentos_select on public.parcelamentos for select to authenticated
  using (public.is_household_member(household_id));
create policy parcelamentos_insert on public.parcelamentos for insert to authenticated
  with check (public.pode_escrever_household(household_id));
create policy parcelamentos_update on public.parcelamentos for update to authenticated
  using (public.pode_escrever_household(household_id))
  with check (public.pode_escrever_household(household_id));
create policy parcelamentos_delete on public.parcelamentos for delete to authenticated
  using (public.pode_escrever_household(household_id));

-- ---------- TRANSACOES ----------
drop policy if exists transacoes_all on public.transacoes;
drop policy if exists transacoes_select on public.transacoes;
drop policy if exists transacoes_insert on public.transacoes;
drop policy if exists transacoes_update on public.transacoes;
drop policy if exists transacoes_delete on public.transacoes;
create policy transacoes_select on public.transacoes for select to authenticated
  using (public.is_household_member(household_id));
create policy transacoes_insert on public.transacoes for insert to authenticated
  with check (public.pode_escrever_household(household_id));
create policy transacoes_update on public.transacoes for update to authenticated
  using (public.pode_escrever_household(household_id))
  with check (public.pode_escrever_household(household_id));
create policy transacoes_delete on public.transacoes for delete to authenticated
  using (public.pode_escrever_household(household_id));

-- ---------- HOUSEHOLD_CONVITES ----------
drop policy if exists convites_select on public.household_convites;
create policy convites_select on public.household_convites
  for select to authenticated
  using (
    public.pode_gerenciar_household(household_id)
    or lower(email_convidado) = lower((auth.jwt() ->> 'email')::text)
  );

drop policy if exists convites_insert on public.household_convites;
create policy convites_insert on public.household_convites
  for insert to authenticated
  with check (
    convidado_por = (select auth.uid())
    and exists (
      select 1
      from public.households h
      join public.household_membros hm on hm.household_id = h.id
      where h.id = household_convites.household_id
        and h.nome not ilike '% (pessoal)'
        and hm.user_id = (select auth.uid())
        and hm.papel in ('owner','admin')
    )
  );

drop policy if exists convites_update on public.household_convites;
create policy convites_update on public.household_convites
  for update to authenticated
  using ( false )
  with check ( false );

drop policy if exists convites_delete on public.household_convites;
create policy convites_delete on public.household_convites
  for delete to authenticated
  using ( false );

-- ---------- LISTA DE MERCADO ----------
drop policy if exists lista_mercado_itens_all on public.lista_mercado_itens;
drop policy if exists lista_mercado_itens_select on public.lista_mercado_itens;
drop policy if exists lista_mercado_itens_insert on public.lista_mercado_itens;
drop policy if exists lista_mercado_itens_update on public.lista_mercado_itens;
drop policy if exists lista_mercado_itens_delete on public.lista_mercado_itens;
create policy lista_mercado_itens_select on public.lista_mercado_itens for select to authenticated
  using (public.is_household_member(household_id));
create policy lista_mercado_itens_insert on public.lista_mercado_itens for insert to authenticated
  with check (public.pode_escrever_household(household_id));
create policy lista_mercado_itens_update on public.lista_mercado_itens for update to authenticated
  using (public.pode_escrever_household(household_id))
  with check (public.pode_escrever_household(household_id));
create policy lista_mercado_itens_delete on public.lista_mercado_itens for delete to authenticated
  using (public.pode_escrever_household(household_id));

-- ============================================================================
-- GRANTS
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant execute on function public.is_household_member(uuid) to authenticated;
revoke all on function public.pode_escrever_household(uuid) from public, anon;
revoke all on function public.pode_gerenciar_household(uuid) from public, anon;
grant execute on function public.pode_escrever_household(uuid) to authenticated;
grant execute on function public.pode_gerenciar_household(uuid) to authenticated;
grant execute on function public.aceitar_convite(uuid) to authenticated;
grant execute on function public.cancelar_convite(uuid) to authenticated;
revoke all on function public.alterar_papel_membro_household(uuid, text) from public, anon;
grant execute on function public.alterar_papel_membro_household(uuid, text) to authenticated;
revoke all on function public.remover_membro_household(uuid) from public;
revoke all on function public.remover_membro_household(uuid) from anon;
grant execute on function public.remover_membro_household(uuid) to authenticated;

-- ============================================================================
-- FIM
-- ============================================================================
