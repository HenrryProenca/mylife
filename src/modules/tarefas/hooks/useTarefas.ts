import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
import { criarTarefa, definirConclusao, excluirTarefa, listarConclusoes, listarTarefas } from '../services/tarefas.service';
import type { TarefaInput } from '../types/tarefas.types';

const key = ['tarefas'];
export function useTarefas(start: string, end: string) {
  const { activeHousehold } = useHousehold();
  const client = useQueryClient();
  const householdId = activeHousehold?.id ?? null;
  const podeEscrever = podeEscreverNoHousehold(activeHousehold?.membership.papel);
  const refresh = () => client.invalidateQueries({ queryKey: key });
  const requireWrite = () => {
    if (!householdId) throw new Error('Selecione um espaço para continuar.');
    if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
    return householdId;
  };
  const tarefas = useQuery({ queryKey: [...key, 'lista', householdId], enabled: Boolean(householdId), queryFn: () => listarTarefas(householdId!) });
  const conclusoes = useQuery({ queryKey: [...key, 'conclusoes', householdId, start, end], enabled: Boolean(householdId), queryFn: () => listarConclusoes(householdId!, start, end) });
  const create = useMutation({ mutationFn: (input: TarefaInput) => criarTarefa(requireWrite(), input), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => excluirTarefa(requireWrite(), id), onSuccess: refresh });
  const complete = useMutation({ mutationFn: ({ id, date, done }: { id: string; date: string; done: boolean }) => definirConclusao(requireWrite(), id, date, done), onSuccess: refresh });
  return {
    tarefas: tarefas.data ?? [], conclusoes: conclusoes.data ?? [],
    isLoading: tarefas.isLoading || conclusoes.isLoading, isError: tarefas.isError || conclusoes.isError,
    error: tarefas.error ?? conclusoes.error, criarTarefa: create.mutateAsync,
    excluirTarefa: remove.mutateAsync, definirConclusao: complete.mutateAsync,
    podeEscrever, isCreating: create.isPending,
  };
}
