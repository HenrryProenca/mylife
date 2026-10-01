import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
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
  const podeEscrever = podeEscreverNoHousehold(activeHousehold?.membership.papel);

  const query = useQuery({
    queryKey: [...responsaveisQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: async () => {
      if (!householdId) return [];
      if (podeEscrever) await garantirResponsaveisPadrao(householdId);
      return listarResponsaveisAtivos(householdId);
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ResponsavelFormValues) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de criar responsáveis.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
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
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de editar responsáveis.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
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
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de excluir responsáveis.');
      if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
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
