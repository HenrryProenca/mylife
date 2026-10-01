-- Reaplica as policies necessarias para criar e selecionar familias.
-- Execute no SQL Editor do projeto Supabase.

alter table public.perfis enable row level security;
alter table public.households enable row level security;
alter table public.household_membros enable row level security;

drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (
    (select auth.uid()) = created_by
    or public.is_household_member(id)
  );

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

grant select, insert, update, delete on public.perfis to authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select, insert, update, delete on public.household_membros to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
