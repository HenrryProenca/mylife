-- Permite que owner e admin removam membros que não sejam o owner.
-- Execute este arquivo no SQL Editor para atualizar um banco já configurado.

create or replace function public.remover_membro_household(p_membro_id uuid)
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

revoke all on function public.remover_membro_household(uuid) from public;
revoke all on function public.remover_membro_household(uuid) from anon;
grant execute on function public.remover_membro_household(uuid) to authenticated;
