import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
import {
  atualizarTransacao,
  criarTransacao,
  excluirTransacao,
  listarTransacoes,
} from '../services/transacoes.service';
import type { TransacaoFormValues, TransacaoInsertInput } from '../types/transacoes.types';

export const transacoesQueryKey = ['transacoes'];

export function useTransacoes(inicio?: string, fim?: string) {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;
  const podeEscrever = podeEscreverNoHousehold(activeHousehold?.membership.papel);

  const query = useQuery({
    queryKey: [...transacoesQueryKey, householdId, inicio, fim],
    enabled: Boolean(householdId),
    queryFn: () => listarTransacoes(householdId as string, inicio, fim),
  });

  const createMutation = useMutation({
    mutationFn: (values: TransacaoFormValues) => {
      if (!householdId || !user) throw new Error('Você precisa estar autenticado e ter um espaço ativo.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
      const input: TransacaoInsertInput = { ...values, household_id: householdId, created_by: user.id };
      return criarTransacao(input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransacaoFormValues }) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de editar o lançamento.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
      return atualizarTransacao(householdId, id, values);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de excluir o lançamento.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
      return excluirTransacao(householdId, id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  return {
    transacoes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    criarTransacao: createMutation.mutateAsync,
    atualizarTransacao: updateMutation.mutateAsync,
    excluirTransacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
