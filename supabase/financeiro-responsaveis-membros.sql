-- Vincula um responsável a uma pessoa da família sem restringir nomes iguais.
-- Transações antigas continuam apontando para os mesmos registros.

alter table public.responsaveis
  drop constraint if exists responsaveis_household_id_nome_key;

create unique index if not exists responsaveis_household_user_unique
  on public.responsaveis (household_id, user_id)
  where user_id is not null;

comment on table public.responsaveis is 'Responsáveis das movimentações, associados aos membros do household e mantidos para preservar o histórico.';

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

insert into public.responsaveis (household_id, user_id, nome, ativo)
select hm.household_id, hm.user_id, coalesce(nullif(trim(p.nome), ''), 'Membro'), true
from public.household_membros hm
join public.perfis p on p.id = hm.user_id
on conflict (household_id, user_id) where user_id is not null
do update set nome = excluded.nome, ativo = true;
