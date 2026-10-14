import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
import { aplicarListaFixa, atualizarCompra, atualizarItemBase, atualizarItemComprado, atualizarItemCompra, atualizarStatusItemListaMercado, criarCompra, criarItemListaMercado, criarListaFixa, editarItemLista, excluirCompra, excluirItemListaMercado, excluirListaFixa, listarCompras, listarItensListaMercado, listarListasFixas, registrarHistoricoCompra, atualizarPrecoRealItem } from '../services/listaMercado.service';
import type { Compra, CompraItemInput, ListaFixa, ListaMercadoItem, ListaMercadoItemInput, ListaMercadoStatus } from '../types/listaMercado.types';

export const listaMercadoQueryKey = ['lista-mercado'];
const comprasQueryKey = ['lista-mercado-compras'];

export function useListaMercado() {
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;
  const podeEscrever = podeEscreverNoHousehold(activeHousehold?.membership.papel);
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: listaMercadoQueryKey }),
    queryClient.invalidateQueries({ queryKey: comprasQueryKey }),
  ]).then(() => undefined);
  const requireWrite = () => {
    if (!householdId) throw new Error('Selecione um espaço para continuar.');
    if (!podeEscrever) throw new Error('Seu acesso permite apenas visualizar os dados deste espaço.');
    return householdId;
  };

  const itemsQuery = useQuery({ queryKey: [...listaMercadoQueryKey, householdId], enabled: Boolean(householdId), queryFn: () => listarItensListaMercado(householdId!) });
  const comprasQuery = useQuery({ queryKey: [...comprasQueryKey, householdId], enabled: Boolean(householdId), queryFn: () => listarCompras(householdId!) });
  const listasFixasQuery = useQuery({ queryKey: ['lista-mercado-fixas', householdId], enabled: Boolean(householdId), queryFn: () => listarListasFixas(householdId!) });
  const createMutation = useMutation({ mutationFn: (input: ListaMercadoItemInput) => criarItemListaMercado(requireWrite(), input), onSuccess: invalidate });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: ListaMercadoStatus }) => { const idHouse = requireWrite(); return atualizarStatusItemListaMercado(idHouse, id, status); }, onSuccess: invalidate });
  const boughtMutation = useMutation({ mutationFn: ({ item, status, date }: { item: ListaMercadoItem; status: ListaMercadoStatus; date: string }) => atualizarItemComprado(requireWrite(), item, status, date), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id: string) => excluirItemListaMercado(requireWrite(), id), onSuccess: invalidate });
  const priceMutation = useMutation({ mutationFn: ({ id, price }: { id: string; price: number }) => atualizarItemBase(requireWrite(), id, { preco_referencia: price }), onSuccess: invalidate });
  const realPriceMutation = useMutation({ mutationFn: ({ id, price }: { id: string; price: number | null }) => atualizarPrecoRealItem(requireWrite(), id, price), onSuccess: invalidate });
  const editMutation = useMutation({ mutationFn: ({ id, values }: { id: string; values: ListaMercadoItemInput }) => editarItemLista(requireWrite(), id, values), onSuccess: invalidate });
  const createPurchaseMutation = useMutation({ mutationFn: ({ date, items }: { date: string; items: CompraItemInput[] }) => criarCompra(requireWrite(), date, items), onSuccess: invalidate });
  const saveHistoryMutation = useMutation({ mutationFn: ({ date, items }: { date: string; items: ListaMercadoItem[] }) => registrarHistoricoCompra(requireWrite(), date, items), onSuccess: invalidate });
  const purchaseItemMutation = useMutation({ mutationFn: ({ id, bought, price }: { id: string; bought?: boolean; price?: number | null }) => { const idHouse = requireWrite(); return atualizarItemCompra(idHouse, id, { ...(bought === undefined ? {} : { comprado: bought }), ...(price === undefined ? {} : { preco_real: price }) }); }, onSuccess: invalidate });
  const purchaseMutation = useMutation({ mutationFn: ({ purchase, status, date }: { purchase: Compra; status?: Compra['status']; date?: string }) => { const idHouse = requireWrite(); return atualizarCompra(idHouse, purchase, { ...(status ? { status } : {}), ...(date ? { data_compra: date } : {}) }); }, onSuccess: invalidate });
  const saveTemplateMutation = useMutation({ mutationFn: ({ name, items }: { name: string; items: ListaMercadoItem[] }) => criarListaFixa(requireWrite(), name, items), onSuccess: invalidate });
  const applyTemplateMutation = useMutation({ mutationFn: (template: ListaFixa) => aplicarListaFixa(requireWrite(), template), onSuccess: invalidate });
  const deleteTemplateMutation = useMutation({ mutationFn: (id: string) => excluirListaFixa(requireWrite(), id), onSuccess: invalidate });
  const deletePurchaseMutation = useMutation({ mutationFn: (id: string) => { const idHouse = requireWrite(); return excluirCompra(idHouse, id); }, onSuccess: invalidate });

  return {
    itens: itemsQuery.data ?? [], compras: comprasQuery.data ?? [], listasFixas: listasFixasQuery.data ?? [],
    isLoading: itemsQuery.isLoading || comprasQuery.isLoading || listasFixasQuery.isLoading,
    isError: itemsQuery.isError || comprasQuery.isError || listasFixasQuery.isError, error: itemsQuery.error ?? comprasQuery.error ?? listasFixasQuery.error,
    criarItem: createMutation.mutateAsync, atualizarStatus: statusMutation.mutateAsync, atualizarComprado: boughtMutation.mutateAsync,
    excluirItem: deleteMutation.mutateAsync, atualizarPreco: priceMutation.mutateAsync, atualizarPrecoReal: realPriceMutation.mutateAsync, editarItem: editMutation.mutateAsync,
    criarCompra: createPurchaseMutation.mutateAsync, salvarHistorico: saveHistoryMutation.mutateAsync, atualizarItemCompra: purchaseItemMutation.mutateAsync,
    atualizarCompra: purchaseMutation.mutateAsync, salvarListaFixa: saveTemplateMutation.mutateAsync,
    aplicarListaFixa: applyTemplateMutation.mutateAsync, excluirListaFixa: deleteTemplateMutation.mutateAsync,
    excluirCompra: deletePurchaseMutation.mutateAsync, podeEscrever,
    isCreating: createMutation.isPending, isDeleting: deleteMutation.isPending,
  };
}
