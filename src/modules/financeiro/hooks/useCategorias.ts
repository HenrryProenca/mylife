import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import {
  listarCategoriasPorHousehold,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
} from '../services/categorias.service';
import type {
  Categoria,
  CategoriaFormValues,
  CategoriaInsertInput,
  CategoriaUpdateInput,
} from '../types/categorias.types';

export const categoriasQueryKey = ['categorias'];

export function useCategorias() {
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();

  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...categoriasQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: async () => {
      if (!householdId) {
        return [] as Categoria[];
      }

      return listarCategoriasPorHousehold(householdId);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CategoriaFormValues) => {
      if (!householdId) {
        throw new Error('Você precisa selecionar uma família antes de criar categorias.');
      }

      const payload: CategoriaInsertInput = {
        household_id: householdId,
        nome: input.nome,
        tipo: input.tipo,
        natureza: input.natureza,
        cor: input.cor || null,
        icone: input.icone || null,
        ativa: input.ativa,
      };

      return criarCategoria(householdId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      categoriaId,
      values,
    }: {
      categoriaId: string;
      values: CategoriaFormValues;
    }) => {
      if (!householdId) {
        throw new Error('Você precisa selecionar uma família antes de editar categorias.');
      }

      const payload: CategoriaUpdateInput = {
        nome: values.nome,
        tipo: values.tipo,
        natureza: values.natureza,
        cor: values.cor || null,
        icone: values.icone || null,
        ativa: values.ativa,
      };

      return atualizarCategoria(householdId, categoriaId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoriaId: string) => {
      if (!householdId) {
        throw new Error('Você precisa selecionar uma família antes de excluir categorias.');
      }

      await excluirCategoria(householdId, categoriaId);
      return categoriaId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
    },
  });

  return {
    categorias: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createCategoria: createMutation.mutateAsync,
    updateCategoria: updateMutation.mutateAsync,
    deleteCategoria: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
}
