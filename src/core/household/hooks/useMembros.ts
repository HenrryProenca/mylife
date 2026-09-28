import { useQuery } from '@tanstack/react-query';
import { useHousehold } from '../useHousehold';
import { listarMembrosDoHousehold } from '../household.service';

export const membrosQueryKey = ['membros'];

export function useMembros() {
  const { activeHousehold } = useHousehold();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...membrosQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarMembrosDoHousehold(householdId as string),
  });

  return {
    membros: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
