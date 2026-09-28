#!/usr/bin/env bash

# ============================================================
# Bloco G1-c — Ajustes no service e hook de responsáveis
# ============================================================
# O que este script faz:
# - Adiciona tipos de create/update em responsaveis.types.ts
# - Adiciona criarResponsavel, atualizarResponsavel, excluirResponsavel
#   no service
# - Expõe mutations no hook useResponsaveis
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/modules/financeiro/types/responsaveis.types.ts (sobrescrito)
#   - src/modules/financeiro/services/responsaveis.service.ts (sobrescrito)
#   - src/modules/financeiro/hooks/useResponsaveis.ts (sobrescrito)
# ============================================================

set -e

# Garante que as pastas existem (defesa contra erro de diretório)
mkdir -p src/modules/financeiro/types
mkdir -p src/modules/financeiro/services
mkdir -p src/modules/financeiro/hooks

# ---------- ALTERAR: types/responsaveis.types.ts ----------
cat << 'EOF' > src/modules/financeiro/types/responsaveis.types.ts
export interface Responsavel {
  id: string;
  household_id: string;
  nome: string;
  user_id: string | null;
  ativo: boolean;
}

export interface ResponsavelInsertInput {
  household_id: string;
  nome: string;
  user_id?: string | null;
  ativo?: boolean;
}

export interface ResponsavelUpdateInput {
  nome?: string;
  user_id?: string | null;
  ativo?: boolean;
}

export interface ResponsavelFormValues {
  nome: string;
  user_id: string;
  ativo: boolean;
}
EOF

# ---------- ALTERAR: services/responsaveis.service.ts ----------
cat << 'EOF' > src/modules/financeiro/services/responsaveis.service.ts
import { supabase } from '@/lib/supabase';
import type {
  Responsavel,
  ResponsavelInsertInput,
  ResponsavelUpdateInput,
} from '../types/responsaveis.types';
import { buildSeedResponsaveis } from '../utils/seedResponsaveis';

export async function listarResponsaveisAtivos(householdId: string): Promise<Responsavel[]> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('id, household_id, nome, user_id, ativo')
    .eq('household_id', householdId)
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Responsavel[];
}

export async function garantirResponsaveisPadrao(householdId: string): Promise<void> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('nome')
    .eq('household_id', householdId);

  if (error) throw error;

  const existing = new Set((data ?? []).map((r) => r.nome));
  const missing = buildSeedResponsaveis(householdId).filter((r) => !existing.has(r.nome));

  if (missing.length === 0) return;

  const { error: insertError } = await supabase.from('responsaveis').insert(missing);
  if (insertError) throw insertError;
}

export async function criarResponsavel(
  householdId: string,
  input: ResponsavelInsertInput,
): Promise<Responsavel> {
  const nome = input.nome.trim();

  if (!nome) {
    throw new Error('O nome do responsável é obrigatório.');
  }

  const { data, error } = await supabase
    .from('responsaveis')
    .insert({
      household_id: householdId,
      nome,
      user_id: input.user_id ?? null,
      ativo: input.ativo ?? true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um responsável com este nome nesta família.');
    }
    throw error;
  }

  return data as Responsavel;
}

export async function atualizarResponsavel(
  householdId: string,
  responsavelId: string,
  input: ResponsavelUpdateInput,
): Promise<Responsavel> {
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) {
    const nome = input.nome.trim();
    if (!nome) {
      throw new Error('O nome do responsável não pode ficar em branco.');
    }
    payload.nome = nome;
  }

  if (input.user_id !== undefined) {
    payload.user_id = input.user_id ?? null;
  }

  if (input.ativo !== undefined) {
    payload.ativo = input.ativo;
  }

  const { data, error } = await supabase
    .from('responsaveis')
    .update(payload)
    .eq('id', responsavelId)
    .eq('household_id', householdId)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um responsável com este nome nesta família.');
    }
    throw error;
  }

  return data as Responsavel;
}

export async function excluirResponsavel(
  householdId: string,
  responsavelId: string,
): Promise<void> {
  const { error } = await supabase
    .from('responsaveis')
    .delete()
    .eq('id', responsavelId)
    .eq('household_id', householdId);

  if (error) throw error;
}
EOF

# ---------- ALTERAR: hooks/useResponsaveis.ts ----------
cat << 'EOF' > src/modules/financeiro/hooks/useResponsaveis.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import {
  atualizarResponsavel as atualizarResponsavelService,
  criarResponsavel as criarResponsavelService,
  excluirResponsavel as excluirResponsavelService,
  garantirResponsaveisPadrao,
  listarResponsaveisAtivos,
} from '../services/responsaveis.service';
import type {
  ResponsavelFormValues,
  ResponsavelInsertInput,
  ResponsavelUpdateInput,
} from '../types/responsaveis.types';

export const responsaveisQueryKey = ['responsaveis'];

export function useResponsaveis() {
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...responsaveisQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: async () => {
      if (!householdId) return [];
      await garantirResponsaveisPadrao(householdId);
      return listarResponsaveisAtivos(householdId);
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ResponsavelFormValues) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de criar responsáveis.');
      const input: ResponsavelInsertInput = {
        household_id: householdId,
        nome: values.nome,
        user_id: values.user_id || null,
        ativo: values.ativo,
      };
      return criarResponsavelService(householdId, input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: responsaveisQueryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      responsavelId,
      values,
    }: {
      responsavelId: string;
      values: ResponsavelFormValues;
    }) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de editar responsáveis.');
      const input: ResponsavelUpdateInput = {
        nome: values.nome,
        user_id: values.user_id || null,
        ativo: values.ativo,
      };
      return atualizarResponsavelService(householdId, responsavelId, input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: responsaveisQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (responsavelId: string) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de excluir responsáveis.');
      return excluirResponsavelService(householdId, responsavelId);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: responsaveisQueryKey }),
  });

  return {
    responsaveis: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    criarResponsavel: createMutation.mutateAsync,
    atualizarResponsavel: updateMutation.mutateAsync,
    excluirResponsavel: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 3 arquivos modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. Se estiver OK: git add . && git commit -m \"feat: adiciona CRUD de responsaveis no service e hook\" && git push"
echo ""
