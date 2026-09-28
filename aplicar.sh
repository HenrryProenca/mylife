#!/usr/bin/env bash

# ============================================================
# Bloco G1-d+ — Lista completa de membros do household
# ============================================================
# O que este script faz:
# - Adiciona listarMembrosDoHousehold no household.service
# - Cria o hook useMembros
# - Ajusta FamiliaPage para usar dados completos
# - Ajusta FamilyMembersList para novo contrato
#
# Arquivos criados:
#   - src/core/household/hooks/useMembros.ts
#
# Arquivos alterados:
#   - src/core/household/household.service.ts (sobrescrito)
#   - src/core/household/components/FamilyMembersList.tsx (sobrescrito)
#   - src/core/household/pages/FamiliaPage.tsx (sobrescrito)
# ============================================================

set -e

mkdir -p src/core/household/hooks
mkdir -p src/core/household/components
mkdir -p src/core/household/pages

# ---------- CRIAR: core/household/hooks/useMembros.ts ----------
cat << 'EOF' > src/core/household/hooks/useMembros.ts
import { useQuery } from '@tanstack/react-query';
import { useHousehold } from '../useHousehold';
import { listarMembrosDoHousehold } from '../household.service';

export const membrosQueryKey = ['membros'];

export function useMembros() {
  const { activeHousehold } = useHousehold();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...membrosQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarMembrosDoHousehold(householdId as string),
  });

  return {
    membros: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
EOF

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
      const { error: seedCategoriasError } = await supabase.from('categorias').insert(seedCategorias);

      if (seedCategoriasError) {
        throw seedCategoriasError;
      }
    }

    const seedResponsaveis = buildSeedResponsaveis(household.id);

    if (seedResponsaveis.length > 0) {
      const { error: seedResponsaveisError } = await supabase.from('responsaveis').insert(seedResponsaveis);

      if (seedResponsaveisError) {
        throw seedResponsaveisError;
      }
    }
  } catch {
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    throw new Error(
      'Não foi possível criar as categorias e responsáveis padrão da família. A criação foi cancelada.',
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
EOF

# ---------- ALTERAR: components/FamilyMembersList.tsx ----------
cat << 'EOF' > src/core/household/components/FamilyMembersList.tsx
import { Crown, Shield, Users } from 'lucide-react';
import type { MembroDoHousehold } from '../household.service';
import type { HouseholdRole } from '../types';

interface FamilyMembersListProps {
  membros: MembroDoHousehold[];
  isLoading?: boolean;
}

const papelLabels: Record<HouseholdRole, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  membro: 'Membro',
};

const papelIcons: Record<HouseholdRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  membro: Users,
};

export function FamilyMembersList({ membros, isLoading = false }: FamilyMembersListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
        Carregando membros...
      </div>
    );
  }

  if (membros.length === 0) {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
        Nenhum membro cadastrado.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {membros.map((membro) => {
        const Icon = papelIcons[membro.papel] ?? Users;

        return (
          <div
            key={membro.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-canvas-300 bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-semibold overflow-hidden">
                {membro.avatar_url ? (
                  <img
                    src={membro.avatar_url}
                    alt={membro.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  membro.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-900">{membro.nome}</div>
                <div className="flex items-center gap-1 text-xs text-ink-500">
                  <Icon className="h-3 w-3" />
                  {papelLabels[membro.papel]}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
EOF

# ---------- ALTERAR: pages/FamiliaPage.tsx ----------
cat << 'EOF' > src/core/household/pages/FamiliaPage.tsx
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHousehold } from '@/core/household/useHousehold';
import { useMembros } from '@/core/household/hooks/useMembros';
import { FamilyInviteForm } from '../components/FamilyInviteForm';
import { FamilyInvitesList } from '../components/FamilyInvitesList';
import { FamilyMembersList } from '../components/FamilyMembersList';

export default function FamiliaPage() {
  const { activeHousehold, households } = useHousehold();
  const { membros, isLoading: carregandoMembros } = useMembros();

  if (!activeHousehold) {
    const temFamilias = households.length > 0;

    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Família</h1>
        <div className="mt-6">
          <EmptyState
            title={temFamilias ? 'Selecione uma família' : 'Nenhuma família cadastrada'}
            description={
              temFamilias
                ? 'Escolha qual família você quer gerenciar.'
                : 'Para convidar membros, crie uma família primeiro.'
            }
            action={
              <Link to={temFamilias ? '/selecionar-familia' : '/onboarding'} className="btn-primary">
                {temFamilias ? 'Selecionar família' : 'Criar família'}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const papelAtual = activeHousehold.membership.papel;
  const podeConvidar = papelAtual === 'owner' || papelAtual === 'admin';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-h2 font-semibold text-ink-900">
            {activeHousehold.nome}
          </h1>
          <p className="text-xs text-ink-500">Gerencie os membros da sua família</p>
        </div>
      </header>

      {podeConvidar ? (
        <section className="card p-5">
          <h2 className="font-display text-h3 text-ink-900">Convidar membro</h2>
          <p className="mt-1 mb-4 text-xs text-ink-500">
            O convite é criado com um link. Envie o link para a pessoa entrar na família.
          </p>
          <FamilyInviteForm />
        </section>
      ) : (
        <section className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
          Apenas dono e administradores podem convidar novos membros.
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-display text-h3 text-ink-900">
          Membros ativos
          {!carregandoMembros && membros.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-ink-500">({membros.length})</span>
          ) : null}
        </h2>
        <p className="mt-1 mb-4 text-xs text-ink-500">
          Pessoas que já aceitaram o convite e fazem parte desta família.
        </p>
        <FamilyMembersList membros={membros} isLoading={carregandoMembros} />
      </section>

      <section className="card p-5">
        <h2 className="font-display text-h3 text-ink-900">Convites pendentes</h2>
        <p className="mt-1 mb-4 text-xs text-ink-500">
          Convites criados que ainda não foram aceitos.
        </p>
        <FamilyInvitesList />
      </section>
    </div>
  );
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 1 novo + 3 modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. npm run dev             (testa /familia novamente)"
echo "  4. Se estiver OK: git add . && git commit -m \"feat: lista completa de membros do household\" && git push"
echo ""
