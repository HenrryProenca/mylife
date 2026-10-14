import { supabase } from '@/lib/supabase';
import type { Compra, CompraItem, CompraItemInput, ListaFixa, ListaMercadoItem, ListaMercadoItemInput, ListaMercadoStatus } from '../types/listaMercado.types';

export async function listarItensListaMercado(householdId: string): Promise<ListaMercadoItem[]> {
  const { data, error } = await supabase.from('lista_mercado_itens').select('*').eq('household_id', householdId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ListaMercadoItem[];
}

export async function criarItemListaMercado(householdId: string, input: ListaMercadoItemInput): Promise<ListaMercadoItem> {
  const { data, error } = await supabase.from('lista_mercado_itens').insert({
    household_id: householdId, nome: input.nome.trim(), quantidade: input.quantidade.trim() || null,
    observacao: input.observacao.trim() || null, unidade: input.unidade,
    preco_referencia: input.preco_referencia ? Number(input.preco_referencia) : null, preco_real: null, data_compra: null, status: 'pendente',
  }).select('*').single();
  if (error) throw error;
  return data as ListaMercadoItem;
}

export async function atualizarItemBase(householdId: string, id: string, values: Partial<Pick<ListaMercadoItem, 'preco_referencia' | 'status' | 'data_compra'>>): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').update(values).eq('id', id).eq('household_id', householdId);
  if (error) throw error;
}

export async function editarItemLista(householdId: string, id: string, values: ListaMercadoItemInput): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').update({
    nome: values.nome.trim(), quantidade: values.quantidade.trim() || null,
    observacao: values.observacao.trim() || null, unidade: values.unidade,
    preco_referencia: values.preco_referencia === '' ? null : Number(values.preco_referencia),
    ...(values.preco_real === undefined ? {} : { preco_real: values.preco_real === '' ? null : Number(values.preco_real) }),
  }).eq('id', id).eq('household_id', householdId);
  if (error) throw error;
}

export async function registrarItemComprado(householdId: string, item: ListaMercadoItem, dataCompra: string): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').update({ status: 'comprado', data_compra: dataCompra }).eq('id', item.id).eq('household_id', householdId);
  if (error) throw error;
}

export async function atualizarStatusItemListaMercado(householdId: string, itemId: string, status: ListaMercadoStatus): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').update({ status }).eq('id', itemId).eq('household_id', householdId);
  if (error) throw error;
}

export async function atualizarItemComprado(householdId: string, item: ListaMercadoItem, status: ListaMercadoStatus, dataCompra: string): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').update({ status, data_compra: status === 'comprado' ? dataCompra : null, ...(status === 'comprado' ? { preco_real: item.preco_real ?? item.preco_referencia } : {}) }).eq('id', item.id).eq('household_id', householdId);
  if (error) throw error;
}

export async function excluirItemListaMercado(householdId: string, itemId: string): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').delete().eq('id', itemId).eq('household_id', householdId);
  if (error) throw error;
}

export async function listarCompras(householdId: string): Promise<Compra[]> {
  const { data, error } = await supabase.from('lista_mercado_compras').select('*, itens:lista_mercado_compra_itens(*)')
    .eq('household_id', householdId).order('data_compra', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Compra[];
}

export async function atualizarPrecoRealItem(householdId: string, id: string, precoReal: number | null): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').update({ preco_real: precoReal }).eq('id', id).eq('household_id', householdId);
  if (error) throw error;
}

export async function excluirCompra(householdId: string, compraId: string): Promise<void> {
  const { error } = await supabase.from('lista_mercado_compras').delete().eq('id', compraId).eq('household_id', householdId);
  if (error) throw error;
}

export async function listarListasFixas(householdId: string): Promise<ListaFixa[]> {
  const { data, error } = await supabase.from('lista_mercado_listas_fixas').select('*, itens:lista_mercado_listas_fixas_itens(*)').eq('household_id', householdId).order('nome');
  if (error) throw error;
  return (data ?? []) as ListaFixa[];
}

export async function criarListaFixa(householdId: string, nome: string, itens: ListaMercadoItem[]): Promise<ListaFixa> {
  const { data, error } = await supabase.from('lista_mercado_listas_fixas').insert({ household_id: householdId, nome: nome.trim() }).select('*').single();
  if (error) throw error;
  const lista = data as ListaFixa;
  const { error: itemsError } = await supabase.from('lista_mercado_listas_fixas_itens').insert(itens.map((item) => ({
    household_id: householdId, lista_id: lista.id, nome: item.nome, quantidade: item.quantidade,
    observacao: item.observacao, unidade: item.unidade, preco_referencia: item.preco_referencia,
  })));
  if (itemsError) {
    await supabase.from('lista_mercado_listas_fixas').delete().eq('id', lista.id).eq('household_id', householdId);
    throw itemsError;
  }
  return lista;
}

export async function aplicarListaFixa(householdId: string, lista: ListaFixa): Promise<void> {
  const { error } = await supabase.from('lista_mercado_itens').insert((lista.itens ?? []).map((item) => ({
    household_id: householdId, template_id: lista.id, nome: item.nome, quantidade: item.quantidade,
    observacao: item.observacao, unidade: item.unidade, preco_referencia: item.preco_referencia, status: 'pendente',
  })));
  if (error) throw error;
}

export async function excluirListaFixa(householdId: string, listaId: string): Promise<void> {
  const { error } = await supabase.from('lista_mercado_listas_fixas').delete().eq('id', listaId).eq('household_id', householdId);
  if (error) throw error;
}

export async function criarCompra(householdId: string, dataCompra: string, itens: CompraItemInput[]): Promise<Compra> {
  const { data, error } = await supabase.from('lista_mercado_compras').insert({ household_id: householdId, data_compra: dataCompra }).select('*').single();
  if (error) throw error;
  const compra = data as Compra;
  const { error: itensError } = await supabase.from('lista_mercado_compra_itens').insert(itens.map((item) => ({
    household_id: householdId, compra_id: compra.id, item_base_id: item.itemBaseId, nome: item.nome,
    quantidade: item.quantidade, unidade: item.unidade, preco_estimado: item.precoEstimado,
  })));
  if (itensError) {
    await supabase.from('lista_mercado_compras').delete().eq('id', compra.id).eq('household_id', householdId);
    throw itensError;
  }
  return compra;
}

export async function registrarHistoricoCompra(householdId: string, dataCompra: string, itens: ListaMercadoItem[]): Promise<Compra> {
  const { data, error } = await supabase.from('lista_mercado_compras').insert({ household_id: householdId, data_compra: dataCompra, status: 'concluida' }).select('*').single();
  if (error) throw error;
  const compra = data as Compra;
  const { error: itensError } = await supabase.from('lista_mercado_compra_itens').insert(itens.map((item) => ({
    household_id: householdId, compra_id: compra.id, item_base_id: item.id, nome: item.nome,
    quantidade: Number(item.quantidade ?? 1) || 1, unidade: item.unidade || 'un',
    preco_estimado: item.preco_referencia, preco_real: item.preco_real ?? item.preco_referencia, comprado: true,
  })));
  if (itensError) {
    await supabase.from('lista_mercado_compras').delete().eq('id', compra.id).eq('household_id', householdId);
    throw itensError;
  }
  return compra;
}

export async function atualizarItemCompra(householdId: string, itemId: string, values: Partial<Pick<CompraItem, 'comprado' | 'preco_real'>>): Promise<void> {
  const { error } = await supabase.from('lista_mercado_compra_itens').update(values).eq('id', itemId).eq('household_id', householdId);
  if (error) throw error;
}

export async function atualizarCompra(householdId: string, compra: Compra, values: Partial<Pick<Compra, 'data_compra' | 'status'>>): Promise<void> {
  const { error } = await supabase.from('lista_mercado_compras').update(values).eq('id', compra.id).eq('household_id', householdId);
  if (error) throw error;
  if (values.status === 'concluida') {
    const updates = (compra.itens ?? []).filter((item) => item.item_base_id && item.preco_real !== null)
      .map((item) => supabase.from('lista_mercado_itens').update({ preco_referencia: item.preco_real }).eq('id', item.item_base_id!).eq('household_id', householdId));
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error)?.error;
    if (failed) throw failed;
  }
}
