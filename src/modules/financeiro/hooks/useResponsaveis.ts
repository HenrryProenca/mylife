import { useQuery } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { garantirResponsaveisPadrao, listarResponsaveisAtivos } from '../services/responsaveis.service';

export const responsaveisQueryKey = ['responsaveis'];

export function useResponsaveis() {
  const { activeHousehold } = useHousehold();
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

  return { responsaveis: query.data ?? [], isLoading: query.isLoading };
}
