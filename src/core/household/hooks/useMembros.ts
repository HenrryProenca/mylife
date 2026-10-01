import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '../useHousehold';
import {
  alterarPapelMembroHousehold,
  listarMembrosDoHousehold,
  removerMembroHousehold,
} from '../household.service';
import type { HouseholdRole } from '../types';

export const membrosQueryKey = ['membros'];

export function useMembros(householdIdOverride?: string) {
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = householdIdOverride ?? activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...membrosQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarMembrosDoHousehold(householdId as string),
  });

  const removerMutation = useMutation({
    mutationFn: (membroId: string) => removerMembroHousehold(membroId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: membrosQueryKey }),
  });

  const alterarPapelMutation = useMutation({
    mutationFn: ({ membroId, papel }: { membroId: string; papel: Exclude<HouseholdRole, 'owner'> }) =>
      alterarPapelMembroHousehold(membroId, papel),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: membrosQueryKey }),
  });

  return {
    membros: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    removerMembro: removerMutation.mutateAsync,
    isRemoving: removerMutation.isPending,
    alterarPapel: alterarPapelMutation.mutateAsync,
    isUpdatingRole: alterarPapelMutation.isPending,
  };
}
