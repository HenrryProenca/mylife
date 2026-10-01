import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
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
  const podeEscrever = podeEscreverNoHousehold(activeHousehold?.membership.papel);

  const query = useQuery({
    queryKey: [...listaMercadoQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarItensListaMercado(householdId as string),
  });

  const createMutation = useMutation({
    mutationFn: (input: ListaMercadoItemInput) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de adicionar itens.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
      return criarItemListaMercado(householdId, input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: listaMercadoQueryKey }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListaMercadoStatus }) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de atualizar o item.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
      return atualizarStatusItemListaMercado(householdId, id, status);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: listaMercadoQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de excluir o item.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
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
