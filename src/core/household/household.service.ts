import { supabase } from '@/lib/supabase';
import { garantirPerfil } from '@/core/auth/auth.service';
import { buildSeedCategorias } from '@/modules/financeiro/utils/seedCategorias';
import { buildSeedResponsaveis } from '@/modules/financeiro/utils/seedResponsaveis';
import type {
  CreateHouseholdInput,
  Household,
  HouseholdMember,
  HouseholdWithMembership,
} from './types';

export const ACTIVE_HOUSEHOLD_STORAGE_KEY = 'mylife:household_ativo';
export const NO_ACTIVE_HOUSEHOLD_ID = '__sem_familia__';

export interface MembroDoHousehold {
  id: string;
  household_id: string;
  user_id: string;
  papel: 'owner' | 'admin' | 'membro' | 'visualizador';
  nome: string;
  avatar_url: string | null;
  created_at: string;
}

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

/**
 * Extrai uma mensagem legível de um erro do Supabase.
 * O Supabase não lança Error — lança um objeto { message, code, details, hint }.
 */
function extrairMensagemErro(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return 'erro desconhecido';
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

export async function listarMembrosDoHousehold(
  householdId: string,
): Promise<MembroDoHousehold[]> {
  const { data, error } = await supabase
    .from('household_membros')
    .select('id, household_id, user_id, papel, created_at, perfil:perfis(nome, avatar_url)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  type Row = {
    id: string;
    household_id: string;
    user_id: string;
    papel: 'owner' | 'admin' | 'membro' | 'visualizador';
    created_at: string;
    perfil: { nome: string; avatar_url: string | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    household_id: row.household_id,
    user_id: row.user_id,
    papel: row.papel,
    created_at: row.created_at,
    nome: row.perfil?.nome ?? 'Membro',
    avatar_url: row.perfil?.avatar_url ?? null,
  }));
}

export async function removerMembroHousehold(membroId: string): Promise<void> {
  const { error } = await supabase.rpc('remover_membro_household', {
    p_membro_id: membroId,
  });

  if (error) throw error;
}

export async function alterarPapelMembroHousehold(
  membroId: string,
  papel: Exclude<HouseholdMember['papel'], 'owner'>,
): Promise<void> {
  const { error } = await supabase.rpc('alterar_papel_membro_household', {
    p_membro_id: membroId,
    p_papel: papel,
  });

  if (error) throw error;
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
    await supabase.from('households').delete().eq('id', household.id);
    throw membershipError;
  }

  // ---------- SEED DE CATEGORIAS ----------
  try {
    const seedCategorias = buildSeedCategorias(household.id);

    if (seedCategorias.length > 0) {
      const { error: seedCategoriasError } = await supabase
        .from('categorias')
        .insert(seedCategorias);

      if (seedCategoriasError) throw seedCategoriasError;
    }
  } catch (error) {
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    throw new Error(`Falha ao criar categorias padrão: ${extrairMensagemErro(error)}`);
  }

  // ---------- SEED DE RESPONSÁVEIS ----------
  try {
    const seedResponsaveis = buildSeedResponsaveis(household.id);

    if (seedResponsaveis.length > 0) {
      const { error: seedResponsaveisError } = await supabase
        .from('responsaveis')
        .insert(seedResponsaveis);

      if (seedResponsaveisError) throw seedResponsaveisError;
    }
  } catch (error) {
    await supabase.from('categorias').delete().eq('household_id', household.id);
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    throw new Error(`Falha ao criar responsáveis padrão: ${extrairMensagemErro(error)}`);
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
