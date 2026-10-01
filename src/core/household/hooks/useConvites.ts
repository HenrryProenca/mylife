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

export function useConvites(householdIdOverride?: string) {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = householdIdOverride ?? activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...convitesQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarConvitesDoHousehold(householdId as string),
  });

  const createMutation = useMutation({
    mutationFn: (input: CriarConviteInput) => {
      if (!householdId) throw new Error('Você precisa selecionar um espaço antes de convidar.');
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
