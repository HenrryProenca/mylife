#!/usr/bin/env bash

# ============================================================
# Bloco G1-b — Types + Services + Hooks de convites
# ============================================================
# O que este script faz:
# - Cria os tipos do domínio de convites
# - Cria o service que conversa com household_convites e as RPCs
# - Cria o hook React Query que consome o service
#
# Arquivos criados:
#   - src/core/household/convites.types.ts
#   - src/core/household/convites.service.ts
#   - src/core/household/hooks/useConvites.ts
#
# Arquivos alterados: nenhum
# ============================================================

set -e

# ---------- CRIAR: core/household/convites.types.ts ----------
cat << 'EOF' > src/core/household/convites.types.ts
export type ConviteStatus = 'pendente' | 'aceito' | 'cancelado';
export type ConvitePapel = 'admin' | 'membro';

export interface Convite {
  id: string;
  household_id: string;
  email_convidado: string;
  convidado_por: string;
  papel: ConvitePapel;
  status: ConviteStatus;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface CriarConviteInput {
  email_convidado: string;
  papel: ConvitePapel;
}

export interface AceitarConviteResultado {
  household_id: string;
  membership_id: string;
  papel: ConvitePapel;
}
EOF

# ---------- CRIAR: core/household/convites.service.ts ----------
cat << 'EOF' > src/core/household/convites.service.ts
import { supabase } from '@/lib/supabase';
import type {
  AceitarConviteResultado,
  Convite,
  ConvitePapel,
  CriarConviteInput,
} from './convites.types';

export async function listarConvitesDoHousehold(
  householdId: string,
): Promise<Convite[]> {
  const { data, error } = await supabase
    .from('household_convites')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Convite[];
}

export async function criarConvite(
  householdId: string,
  userId: string,
  input: CriarConviteInput,
): Promise<Convite> {
  const email = input.email_convidado.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    throw new Error('Informe um email válido.');
  }

  const { data, error } = await supabase
    .from('household_convites')
    .insert({
      household_id: householdId,
      email_convidado: email,
      convidado_por: userId,
      papel: input.papel,
      status: 'pendente',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um convite pendente para este email nesta família.');
    }
    throw error;
  }

  return data as Convite;
}

export async function cancelarConvite(conviteId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_convite', {
    p_convite_id: conviteId,
  });

  if (error) throw error;
}

export async function buscarConvitePorToken(token: string): Promise<Convite | null> {
  const { data, error } = await supabase
    .from('household_convites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  return (data as Convite | null) ?? null;
}

export async function aceitarConvite(token: string): Promise<AceitarConviteResultado> {
  const { data, error } = await supabase.rpc('aceitar_convite', {
    p_token: token,
  });

  if (error) throw error;
  return data as AceitarConviteResultado;
}

export function montarLinkConvite(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/aceitar-convite?token=${token}`;
}

export const convitePapelLabels: Record<ConvitePapel, string> = {
  admin: 'Administrador',
  membro: 'Membro',
};
EOF

# ---------- CRIAR: core/household/hooks/useConvites.ts ----------
cat << 'EOF' > src/core/household/hooks/useConvites.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';
import {
  cancelarConvite as cancelarConviteService,
  criarConvite as criarConviteService,
  listarConvitesDoHousehold,
} from '../convites.service';
import type { CriarConviteInput } from '../convites.types';

export const convitesQueryKey = ['convites'];

export function useConvites() {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...convitesQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarConvitesDoHousehold(householdId as string),
  });

  const createMutation = useMutation({
    mutationFn: (input: CriarConviteInput) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de convidar.');
      if (!user) throw new Error('Você precisa estar autenticado.');
      return criarConviteService(householdId, user.id, input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: convitesQueryKey }),
  });

  const cancelMutation = useMutation({
    mutationFn: (conviteId: string) => cancelarConviteService(conviteId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: convitesQueryKey }),
  });

  return {
    convites: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    criarConvite: createMutation.mutateAsync,
    cancelarConvite: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 3 novos arquivos)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. Se estiver OK: git add . && git commit -m \"feat: adiciona types, service e hook de convites\" && git push"
echo ""
