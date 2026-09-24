import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import {
  atualizarStatusItemListaMercado,
  criarItemListaMercado,
  excluirItemListaMercado,
  listarItensListaMercado,
} from '../services/listaMercado.service';
import type { ListaMercadoItemInput, ListaMercadoStatus } from '../types/listaMercado.types';

export const listaMercadoQueryKey = ['lista-mercado'];

export function useListaMercado() {
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...listaMercadoQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarItensListaMercado(householdId as string),
  });

  const createMutation = useMutation({
    mutationFn: (input: ListaMercadoItemInput) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de adicionar itens.');
      return criarItemListaMercado(householdId, input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: listaMercadoQueryKey }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListaMercadoStatus }) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de atualizar o item.');
      return atualizarStatusItemListaMercado(householdId, id, status);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: listaMercadoQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de excluir o item.');
      return excluirItemListaMercado(householdId, id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: listaMercadoQueryKey }),
  });

  return {
    itens: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    criarItem: createMutation.mutateAsync,
    atualizarStatus: statusMutation.mutateAsync,
    excluirItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: statusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
