-- Migração incremental dos módulos Lista de Mercado e Tarefas.
-- Execute no Supabase SQL Editor depois que o schema principal de households
-- tiver sido aplicado. Pode ser executado mais de uma vez.

do $$
begin
  if to_regclass('public.households') is null then
    raise exception 'A tabela public.households não existe. Execute primeiro supabase/schema.sql completo e depois esta migração.';
  end if;
  if to_regprocedure('public.is_household_member(uuid)') is null
     or to_regprocedure('public.pode_escrever_household(uuid)') is null then
    raise exception 'As funções de autorização do household não existem. Execute primeiro supabase/schema.sql completo e depois esta migração.';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'A função public.set_updated_at() não existe. Execute primeiro supabase/schema.sql completo e depois esta migração.';
  end if;
end;
$$;

create table if not exists public.lista_mercado_itens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  quantidade text,
  observacao text,
  unidade text not null default 'un',
  preco_referencia numeric(12,2) check (preco_referencia is null or preco_referencia >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'comprado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lista_mercado_itens
  add column if not exists unidade text not null default 'un',
  add column if not exists preco_referencia numeric(12,2),
  add column if not exists preco_real numeric(12,2),
  add column if not exists data_compra date,
  add column if not exists template_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lista_mercado_itens_preco_referencia_check') then
    alter table public.lista_mercado_itens add constraint lista_mercado_itens_preco_referencia_check check (preco_referencia is null or preco_referencia >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lista_mercado_itens_preco_real_check') then
    alter table public.lista_mercado_itens add constraint lista_mercado_itens_preco_real_check check (preco_real is null or preco_real >= 0);
  end if;
end;
$$;

create table if not exists public.lista_mercado_compras (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  data_compra date not null default current_date,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lista_mercado_listas_fixas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  created_at timestamptz not null default now(),
  unique (household_id, nome)
);

create table if not exists public.lista_mercado_listas_fixas_itens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  lista_id uuid not null references public.lista_mercado_listas_fixas(id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  quantidade text,
  observacao text,
  unidade text not null default 'un',
  preco_referencia numeric(12,2) check (preco_referencia is null or preco_referencia >= 0),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lista_mercado_itens_template_id_fkey') then
    alter table public.lista_mercado_itens
      add constraint lista_mercado_itens_template_id_fkey
      foreign key (template_id) references public.lista_mercado_listas_fixas(id) on delete set null;
  end if;
end;
$$;

create table if not exists public.lista_mercado_compra_itens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  compra_id uuid not null references public.lista_mercado_compras(id) on delete cascade,
  item_base_id uuid references public.lista_mercado_itens(id) on delete set null,
  nome text not null check (length(trim(nome)) > 0),
  quantidade numeric(12,3) not null default 1 check (quantidade > 0),
  unidade text not null default 'un',
  preco_estimado numeric(12,2) check (preco_estimado is null or preco_estimado >= 0),
  preco_real numeric(12,2) check (preco_real is null or preco_real >= 0),
  comprado boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  titulo text not null check (length(trim(titulo)) > 0),
  descricao text,
  frequencia text not null check (frequencia in ('diaria', 'semanal', 'mensal', 'anual')),
  dia_semana smallint check (dia_semana between 0 and 6),
  dia_mes smallint check (dia_mes between 1 and 31),
  mes smallint check (mes between 1 and 12),
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tarefas_recorrencia_check check (
    (frequencia = 'diaria' and dia_semana is null and dia_mes is null and mes is null) or
    (frequencia = 'semanal' and dia_semana is not null and dia_mes is null and mes is null) or
    (frequencia = 'mensal' and dia_semana is null and dia_mes is not null and mes is null) or
    (frequencia = 'anual' and dia_semana is null and dia_mes is not null and mes is not null)
  )
);

create table if not exists public.tarefas_conclusoes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  data_referencia date not null,
  concluida_em timestamptz not null default now(),
  unique (tarefa_id, data_referencia)
);

create index if not exists idx_lista_mercado_household_status on public.lista_mercado_itens (household_id, status);
create index if not exists idx_lista_mercado_compras_household_data on public.lista_mercado_compras (household_id, data_compra desc);
create index if not exists idx_lista_mercado_listas_fixas_household on public.lista_mercado_listas_fixas (household_id, nome);
create index if not exists idx_lista_mercado_listas_fixas_itens_lista on public.lista_mercado_listas_fixas_itens (household_id, lista_id);
create index if not exists idx_lista_mercado_compra_itens_compra on public.lista_mercado_compra_itens (household_id, compra_id);
create index if not exists idx_tarefas_household_frequencia on public.tarefas (household_id, frequencia) where ativa;
create index if not exists idx_tarefas_conclusoes_periodo on public.tarefas_conclusoes (household_id, data_referencia);

drop trigger if exists trg_lista_mercado_compras_updated_at on public.lista_mercado_compras;
create trigger trg_lista_mercado_compras_updated_at before update on public.lista_mercado_compras for each row execute function public.set_updated_at();
drop trigger if exists trg_lista_mercado_itens_updated_at on public.lista_mercado_itens;
create trigger trg_lista_mercado_itens_updated_at before update on public.lista_mercado_itens for each row execute function public.set_updated_at();
drop trigger if exists trg_tarefas_updated_at on public.tarefas;
create trigger trg_tarefas_updated_at before update on public.tarefas for each row execute function public.set_updated_at();

alter table public.lista_mercado_compras enable row level security;
alter table public.lista_mercado_listas_fixas enable row level security;
alter table public.lista_mercado_listas_fixas_itens enable row level security;
alter table public.lista_mercado_itens enable row level security;
alter table public.lista_mercado_compra_itens enable row level security;
alter table public.tarefas enable row level security;
alter table public.tarefas_conclusoes enable row level security;

do $$
declare t text;
begin
  foreach t in array array['lista_mercado_itens','lista_mercado_compras','lista_mercado_compra_itens','lista_mercado_listas_fixas','lista_mercado_listas_fixas_itens','tarefas','tarefas_conclusoes'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.is_household_member(household_id))', t, t);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (public.pode_escrever_household(household_id))', t, t);
    execute format('create policy %I_update on public.%I for update to authenticated using (public.pode_escrever_household(household_id)) with check (public.pode_escrever_household(household_id))', t, t);
    execute format('create policy %I_delete on public.%I for delete to authenticated using (public.pode_escrever_household(household_id))', t, t);
  end loop;
end;
$$;

grant select, insert, update, delete on public.lista_mercado_itens, public.lista_mercado_compras, public.lista_mercado_compra_itens, public.lista_mercado_listas_fixas, public.lista_mercado_listas_fixas_itens, public.tarefas, public.tarefas_conclusoes to authenticated;
