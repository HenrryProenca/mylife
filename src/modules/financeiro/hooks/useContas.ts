import { useQuery } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { listarContasAtivas } from '../services/contas.service';

export const contasQueryKey = ['contas'];

export function useContas() {
  const { activeHousehold } = useHousehold();
  const householdId = activeHousehold?.id ?? null;
  const query = useQuery({
    queryKey: [...contasQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarContasAtivas(householdId as string),
  });

  return { contas: query.data ?? [], isLoading: query.isLoading };
}