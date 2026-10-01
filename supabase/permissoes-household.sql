-- Níveis de acesso por família:
-- admin = gerencia membros e pode escrever;
-- membro = leitura e escrita;
-- visualizador = somente leitura.
-- Execute no SQL Editor de uma instalação já existente.

alter table public.household_membros
  drop constraint if exists household_membros_papel_check;
alter table public.household_membros
  add constraint household_membros_papel_check
  check (papel in ('owner', 'admin', 'membro', 'visualizador'));

alter table public.household_convites
  drop constraint if exists household_convites_papel_check;
alter table public.household_convites
  add constraint household_convites_papel_check
  check (papel in ('admin', 'membro', 'visualizador'));

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

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update to authenticated
  using (public.pode_gerenciar_household(id))
  with check (public.pode_gerenciar_household(id));

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
  using (false)
  with check (false);

drop policy if exists membros_delete on public.household_membros;
create policy membros_delete on public.household_membros
  for delete to authenticated
  using (false);

-- Membros e visualizadores podem consultar os dados da família.
-- Somente owner, admin e membro podem inserir, editar ou excluir dados.
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
        and hm.papel in ('owner', 'admin')
    )
  );

update public.household_convites c
set status = 'cancelado'
from public.households h
where h.id = c.household_id
  and h.nome ilike '% (pessoal)'
  and c.status = 'pendente';

revoke all on function public.pode_escrever_household(uuid) from public, anon;
revoke all on function public.pode_gerenciar_household(uuid) from public, anon;
revoke all on function public.alterar_papel_membro_household(uuid, text) from public, anon;
grant execute on function public.pode_escrever_household(uuid) to authenticated;
grant execute on function public.pode_gerenciar_household(uuid) to authenticated;
grant execute on function public.alterar_papel_membro_household(uuid, text) to authenticated;
