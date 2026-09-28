#!/usr/bin/env bash

# ============================================================
# Debug — Melhora o log de erro do createHousehold
# ============================================================
# O que este script faz:
# - Separa os blocos try/catch dos seeds de categorias e responsáveis
# - Loga a mensagem real do erro no console do navegador
# - Propaga a mensagem específica do erro para o toast
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/core/household/household.service.ts (sobrescrito)
# ============================================================

set -e

mkdir -p src/core/household

# ---------- ALTERAR: core/household/household.service.ts ----------
cat << 'EOF' > src/core/household/household.service.ts
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
  papel: 'owner' | 'admin' | 'membro';
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
    papel: 'owner' | 'admin' | 'membro';
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
    console.error('[createHousehold] erro ao criar household:', householdError);
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
    console.error('[createHousehold] erro ao criar membership:', membershipError);
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

      if (seedCategoriasError) {
        console.error('[createHousehold] erro ao inserir categorias:', seedCategoriasError);
        throw seedCategoriasError;
      }
    }
  } catch (error) {
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    const msg = error instanceof Error ? error.message : 'erro desconhecido';
    throw new Error(`Falha ao criar categorias padrão: ${msg}`);
  }

  // ---------- SEED DE RESPONSÁVEIS ----------
  try {
    const seedResponsaveis = buildSeedResponsaveis(household.id);

    if (seedResponsaveis.length > 0) {
      const { error: seedResponsaveisError } = await supabase
        .from('responsaveis')
        .insert(seedResponsaveis);

      if (seedResponsaveisError) {
        console.error('[createHousehold] erro ao inserir responsáveis:', seedResponsaveisError);
        throw seedResponsaveisError;
      }
    }
  } catch (error) {
    await supabase.from('categorias').delete().eq('household_id', household.id);
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    const msg = error instanceof Error ? error.message : 'erro desconhecido';
    throw new Error(`Falha ao criar responsáveis padrão: ${msg}`);
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
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. npm run dev"
echo "  2. Tente criar uma família novamente"
echo "  3. Abra o Console do navegador (F12 → Console)"
echo "  4. Vai aparecer um log [createHousehold] erro ao inserir X: {...}"
echo "  5. Copie a mensagem e me envie"
echo ""
