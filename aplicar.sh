#!/usr/bin/env bash

# ============================================================
# Frente 2 — Household pessoal automático
# ============================================================
# O que este script faz:
# - Atualiza supabase/schema.sql com a função handle_new_user
#   que também cria household pessoal
# - OnboardingPage: muda texto para "Criar nova família"
# - SelecionarHouseholdPage: mostra "(pessoal)" com selo azul
#   para deixar claro qual é o household pessoal
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - supabase/schema.sql (sobrescrito)
#   - src/core/household/pages/OnboardingPage.tsx (sobrescrito)
#   - src/core/household/pages/SelecionarHouseholdPage.tsx (sobrescrito)
# ============================================================

set -e

mkdir -p supabase
mkdir -p src/core/household/pages

# ---------- ALTERAR: supabase/schema.sql ----------
# Substitui só a função handle_new_user. O resto do arquivo fica igual.
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

comment on table public.households is 'Família / grupo financeiro. Inclui o household pessoal de cada usuário.';

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
                    check (papel in ('admin','membro')),
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

-- ---------- HOUSEHOLD_CONVITES ----------
drop policy if exists convites_select on public.household_convites;
create policy convites_select on public.household_convites
  for select to authenticated
  using (
    public.is_household_member(household_id)
    or lower(email_convidado) = lower((auth.jwt() ->> 'email')::text)
  );

drop policy if exists convites_insert on public.household_convites;
create policy convites_insert on public.household_convites
  for insert to authenticated
  with check (
    convidado_por = (select auth.uid())
    and exists (
      select 1 from public.household_membros
      where household_id = household_convites.household_id
        and user_id = (select auth.uid())
        and papel in ('owner','admin')
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
grant execute on function public.aceitar_convite(uuid) to authenticated;
grant execute on function public.cancelar_convite(uuid) to authenticated;

-- ============================================================================
-- FIM
-- ============================================================================
EOF

# ---------- ALTERAR: core/household/pages/OnboardingPage.tsx ----------
cat << 'EOF' > src/core/household/pages/OnboardingPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const { createHousehold, creating, loading, households } = useHousehold();

  const suggestedName = useMemo(() => {
    const firstName = perfil?.nome?.trim().split(/\s+/)[0] ?? 'Minha';
    return `Família ${firstName}`;
  }, [perfil]);

  const [nome, setNome] = useState(suggestedName);

  useEffect(() => {
    if (!nome.trim() || nome === 'Família') {
      setNome(suggestedName);
    }
  }, [nome, suggestedName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-100 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Verificando suas famílias…</div>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valor = nome.trim();

    if (!valor) {
      toast.error('Informe um nome para a família.');
      return;
    }

    try {
      await createHousehold({ nome: valor });
      toast.success('Família criada com sucesso.');
      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar a família.';
      toast.error(message);
    }
  }

  const temFamilias = households.length > 0;

  return (
    <div className="min-h-screen bg-canvas-100 text-ink-900 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                {temFamilias ? 'Nova família' : 'Primeiros passos'}
              </p>
              <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">
                {temFamilias ? 'Criar nova família' : 'Criar minha família'}
              </h1>
            </div>
          </div>

          <p className="mb-5 text-sm text-ink-500">
            {temFamilias
              ? 'Você já tem um espaço pessoal. Crie uma família para compartilhar lançamentos com outras pessoas.'
              : 'Você já tem um espaço pessoal para seus lançamentos. Crie uma família se quiser compartilhar dados com outras pessoas.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Nome da família
              </label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder={suggestedName}
                className="input-base"
                autoFocus
              />
            </div>

            <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-3 text-sm text-ink-500">
              <span className="font-medium text-ink-900">Sugestão:</span> {suggestedName}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex-1 rounded-lg border border-canvas-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-ink-500 transition hover:bg-canvas-200 hover:text-ink-900"
              >
                Voltar
              </Link>

              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1"
              >
                {creating ? 'Criando família…' : 'Criar família'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
EOF

# ---------- ALTERAR: core/household/pages/SelecionarHouseholdPage.tsx ----------
# Só adiciona um selo visual "(pessoal)" se o nome do household terminar com "(pessoal)"
cat << 'EOF' > src/core/household/pages/SelecionarHouseholdPage.tsx
import { Check, ChevronDown, ChevronRight, Home, Minus, Trash2, User, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useHousehold } from '@/core/household/useHousehold';
import { GerenciarFamiliaPanel } from '../components/GerenciarFamiliaPanel';

function ehPessoal(nome: string): boolean {
  return /\(pessoal\)$/i.test(nome);
}

export default function SelecionarHouseholdPage() {
  const navigate = useNavigate();
  const [gerenciandoId, setGerenciandoId] = useState<string | null>(null);
  const [familiaParaExcluir, setFamiliaParaExcluir] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const {
    households,
    activeHouseholdId,
    setActiveHousehold,
    deleteHousehold,
    deleting,
    loading,
  } = useHousehold();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-100 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Carregando espaços…</div>
        </div>
      </div>
    );
  }

  function handleSelect(householdId: string) {
    setActiveHousehold(householdId);
    toast.success('Espaço selecionado.');
    navigate('/', { replace: true });
  }

  function handleToggleGerenciar(householdId: string) {
    setGerenciandoId((atual) => (atual === householdId ? null : householdId));
  }

  function handleClearSelection() {
    setActiveHousehold(null);
    toast.success('Nenhum espaço selecionado.');
    navigate('/', { replace: true });
  }

  function solicitarExclusao(householdId: string, householdName: string) {
    setFamiliaParaExcluir({ id: householdId, nome: householdName });
  }

  async function confirmarExclusao() {
    if (!familiaParaExcluir) return;

    try {
      await deleteHousehold(familiaParaExcluir.id);
      setFamiliaParaExcluir(null);
      toast.success('Espaço excluído.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir o espaço.';
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-canvas-100 text-ink-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Espaços
              </p>
              <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">
                Selecionar espaço
              </h1>
              <p className="text-xs text-ink-500 mt-1">
                Escolha em qual espaço você quer lançar e visualizar dados
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleClearSelection}
              className={[
                'w-full text-left rounded-xl border px-4 py-4 transition',
                activeHouseholdId === null || activeHouseholdId === '__sem_familia__'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-canvas-300 bg-white hover:border-canvas-400',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas-200 border border-canvas-300">
                    <Minus className="h-4 w-4 text-ink-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900">Nenhum espaço</div>
                    <div className="text-xs text-ink-500">
                      Não usar nenhum espaço agora
                    </div>
                  </div>
                </div>
                {activeHouseholdId === null || activeHouseholdId === '__sem_familia__' ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                    <Check className="h-3.5 w-3.5" />
                    Ativo
                  </span>
                ) : null}
              </div>
            </button>

            {households.map((household) => {
              const selected = household.id === activeHouseholdId;
              const gerenciando = gerenciandoId === household.id;
              const pessoal = ehPessoal(household.nome);

              return (
                <div
                  key={household.id}
                  className={[
                    'rounded-xl border transition',
                    selected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-canvas-300 bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(household.id)}
                      className="min-w-0 flex-1 text-left py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${pessoal ? 'bg-canvas-200 border-canvas-300' : 'bg-canvas-200 border-canvas-300'}`}>
                            {pessoal ? (
                              <User className="h-4 w-4 text-ink-500" />
                            ) : (
                              <Home className="h-4 w-4 text-brand-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate font-semibold text-ink-900">
                                {household.nome}
                              </span>
                              {pessoal ? (
                                <span className="inline-flex items-center rounded-full border border-canvas-300 bg-canvas-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                  Pessoal
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-ink-500 uppercase tracking-wider">
                              {household.membership.papel}
                            </div>
                          </div>
                        </div>

                        {selected ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            <Check className="h-3.5 w-3.5" />
                            Ativo
                          </span>
                        ) : null}
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label={gerenciando ? 'Fechar gerenciamento' : `Gerenciar ${household.nome}`}
                      title={gerenciando ? 'Fechar' : 'Gerenciar'}
                      onClick={() => handleToggleGerenciar(household.id)}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-500 transition hover:bg-brand-50 hover:text-brand-600"
                    >
                      {gerenciando ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Fechar
                        </>
                      ) : (
                        <>
                          Gerenciar
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {household.membership.papel === 'owner' && !pessoal ? (
                      <button
                        type="button"
                        aria-label={`Excluir ${household.nome}`}
                        title="Excluir"
                        disabled={deleting}
                        onClick={() => solicitarExclusao(household.id, household.nome)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition hover:bg-state-error/10 hover:text-state-error disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {gerenciando ? (
                    <div className="border-t border-canvas-300 bg-canvas-50 p-4 animate-fade-in">
                      <GerenciarFamiliaPanel household={household} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between items-center gap-3 text-sm">
            <Link to="/onboarding" className="text-brand-600 hover:underline">
              Criar nova família
            </Link>
            <Link to="/" className="text-ink-500 hover:text-ink-900 transition">
              Voltar
            </Link>
          </div>
        </div>
      </div>

      {familiaParaExcluir ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 px-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setFamiliaParaExcluir(null)}
        >
          <div
            className="card w-full max-w-md p-6 shadow-card-lg animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-exclusao-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption uppercase text-state-error">Atenção</p>
                <h2
                  id="confirmar-exclusao-titulo"
                  className="mt-1 font-display text-h2 font-semibold text-ink-900"
                >
                  Excluir espaço?
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar confirmação"
                onClick={() => setFamiliaParaExcluir(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-canvas-200 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink-500">
              Você está prestes a excluir o espaço{' '}
              <strong className="font-semibold text-ink-900">
                {familiaParaExcluir.nome}
              </strong>
              . Essa ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFamiliaParaExcluir(null)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarExclusao()}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-state-error px-4 py-2.5 font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Excluindo…' : 'Excluir espaço'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "⚠️  IMPORTANTE: antes de rodar o app, rode o SQL no Supabase SQL Editor"
echo "   (arquivo enviado separado, primeiro passo desta frente)."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 3 modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. npm run dev             (testa: novo cadastro cria espaço pessoal)"
echo "  4. Se estiver OK: git add . && git commit -m \"feat: household pessoal automatico\" && git push"
echo ""
