import { supabase } from '@/lib/supabase';
import type { ListaMercadoItem, ListaMercadoItemInput, ListaMercadoStatus } from '../types/listaMercado.types';

export async function listarItensListaMercado(householdId: string): Promise<ListaMercadoItem[]> {
  const { data, error } = await supabase
    .from('lista_mercado_itens')
    .select('*')
    .eq('household_id', householdId)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ListaMercadoItem[];
}

export async function criarItemListaMercado(householdId: string, input: ListaMercadoItemInput): Promise<ListaMercadoItem> {
  const { data, error } = await supabase
    .from('lista_mercado_itens')
    .insert({
      household_id: householdId,
      nome: input.nome.trim(),
      quantidade: input.quantidade.trim() || null,
      observacao: input.observacao.trim() || null,
      status: 'pendente',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as ListaMercadoItem;
}

export async function atualizarStatusItemListaMercado(householdId: string, itemId: string, status: ListaMercadoStatus): Promise<void> {
  const { error } = await supabase
    .from('lista_mercado_itens')
    .update({ status })
    .eq('id', itemId)
    .eq('household_id', householdId);

  if (error) throw error;
}

export async function excluirItemListaMercado(householdId: string, itemId: string): Promise<void> {
  const { error } = await supabase
    .from('lista_mercado_itens')
    .delete()
    .eq('id', itemId)
    .eq('household_id', householdId);

  if (error) throw error;
}
