import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';
import { atualizarStatusTransacao, atualizarTransacao, criarTransacao, excluirTransacao, listarTransacoes } from '../services/transacoes.service';
import type { Transacao, TransacaoFormValues, TransacaoInsertInput } from '../types/transacoes.types';

export const transacoesQueryKey = ['transacoes'];

export function useTransacoes(inicio?: string, fim?: string) {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...transacoesQueryKey, householdId, inicio, fim],
    enabled: Boolean(householdId),
    queryFn: () => listarTransacoes(householdId as string, inicio, fim),
  });

  const createMutation = useMutation({
    mutationFn: (values: TransacaoFormValues) => {
      if (!householdId || !user) throw new Error('Você precisa selecionar uma família e estar autenticado.');
      const input: TransacaoInsertInput = { ...values, household_id: householdId, created_by: user.id };
      return criarTransacao(input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Transacao['status'] }) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de atualizar o lançamento.');
      return atualizarStatusTransacao(householdId, id, status);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransacaoFormValues }) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de editar o lançamento.');
      return atualizarTransacao(householdId, id, values);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de excluir o lançamento.');
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
    atualizarStatus: statusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,
  };
}