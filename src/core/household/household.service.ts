import { supabase } from '@/lib/supabase';
import { garantirPerfil } from '@/core/auth/auth.service';
import { buildSeedCategorias } from '@/modules/financeiro/utils/seedCategorias';
import type {
  CreateHouseholdInput,
  Household,
  HouseholdMember,
  HouseholdWithMembership,
} from './types';

export const ACTIVE_HOUSEHOLD_STORAGE_KEY = 'mylife:household_ativo';
export const NO_ACTIVE_HOUSEHOLD_ID = '__sem_familia__';

export function getStoredActiveHouseholdId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.localStorage.getItem(ACTIVE_HOUSEHOLD_STORAGE_KEY);
  return storedValue && storedValue.trim().length > 0 ? storedValue : null;
}

export function setStoredActiveHouseholdId(householdId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!householdId) {
    window.localStorage.setItem(ACTIVE_HOUSEHOLD_STORAGE_KEY, NO_ACTIVE_HOUSEHOLD_ID);
    return;
  }

  window.localStorage.setItem(ACTIVE_HOUSEHOLD_STORAGE_KEY, householdId);
}

export async function listarHouseholdsDoUsuario(
  userId: string,
): Promise<HouseholdWithMembership[]> {
  const { data: membershipsData, error: membershipsError } = await supabase
    .from('household_membros')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (membershipsError) {
    throw membershipsError;
  }

  const memberships = (membershipsData ?? []) as HouseholdMember[];

  if (memberships.length === 0) {
    return [];
  }

  const householdIds = memberships.map((membership) => membership.household_id);

  const { data: householdsData, error: householdsError } = await supabase
    .from('households')
    .select('*')
    .in('id', householdIds)
    .order('created_at', { ascending: true });

  if (householdsError) {
    throw householdsError;
  }

  const households = (householdsData ?? []) as Household[];
  const householdsById = new Map<string, Household>();

  households.forEach((household) => {
    householdsById.set(household.id, household);
  });

  const householdList: HouseholdWithMembership[] = memberships
    .map((membership) => {
      const household = householdsById.get(membership.household_id);

      if (!household) {
        return null;
      }

      return {
        ...household,
        membership,
      };
    })
    .filter((household): household is HouseholdWithMembership => household !== null);

  return householdList;
}

export async function createHousehold(
  userId: string,
  input: CreateHouseholdInput,
): Promise<HouseholdWithMembership> {
  const nome = input.nome.trim();

  if (!nome) {
    throw new Error('O nome da família é obrigatório.');
  }

  await garantirPerfil(userId);

  const { data: householdData, error: householdError } = await supabase
    .from('households')
    .insert({
      nome,
      created_by: userId,
    })
    .select('*')
    .single();

  if (householdError) {
    throw householdError;
  }

  const household = householdData as Household;

  const { data: membershipData, error: membershipError } = await supabase
    .from('household_membros')
    .insert({
      household_id: household.id,
      user_id: userId,
      papel: 'owner',
    })
    .select('*')
    .single();

  if (membershipError) {
    const { error: rollbackError } = await supabase
      .from('households')
      .delete()
      .eq('id', household.id);

    if (rollbackError) {
      throw new Error(
        'Não foi possível criar a família e a associação ao usuário. Tente novamente.',
      );
    }

    throw membershipError;
  }

  try {
    const seedCategorias = buildSeedCategorias(household.id);

    if (seedCategorias.length > 0) {
      const { error: seedError } = await supabase.from('categorias').insert(seedCategorias);

      if (seedError) {
        throw seedError;
      }
    }
  } catch (error) {
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    throw new Error(
      'Não foi possível criar as categorias padrão da família. A criação foi cancelada.',
    );
  }

  return {
    ...household,
    membership: membershipData as HouseholdMember,
  };
}

export async function deleteHousehold(
  userId: string,
  householdId: string,
): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .delete()
    .eq('id', householdId)
    .eq('created_by', userId)
    .select('*');

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      'Não foi possível excluir a família. Verifique se você ainda tem permissão.',
    );
  }

  return data[0] as Household;
}

export const criarHousehold = createHousehold;
