import { addMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { LancamentoTipo, Transacao, TransacaoFormValues, TransacaoInsertInput } from '../types/transacoes.types';

export async function listarTransacoes(householdId: string, inicio?: string, fim?: string): Promise<Transacao[]> {
  let query = supabase
    .from('transacoes')
    .select('*, categoria:categorias(nome, natureza, cor), conta:contas(nome, instituicao)')
    .eq('household_id', householdId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });

  if (inicio) query = query.gte('data', inicio);
  if (fim) query = query.lte('data', fim);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Transacao[];
}

function databaseType(tipo: LancamentoTipo) {
  return tipo === 'receita' ? 'receita' : 'despesa';
}

function isParcelado(values: TransacaoFormValues) {
  return values.tipo === 'cartao' && (values.parcela_total ?? 0) > 1;
}

function transactionPayload(householdId: string, userId: string, values: TransacaoFormValues, data: string, parcelamentoId: string | null, parcelaAtual: number | null, parcelaTotal: number | null) {
  return {
    household_id: householdId,
    tipo: databaseType(values.tipo),
    valor: values.valor,
    data,
    descricao: values.descricao.trim() || 'Sem descrição',
    observacao: values.observacao.trim() || null,
    categoria_id: values.categoria_id || null,
    conta_id: values.conta_id || null,
    forma_pagamento: values.forma_pagamento,
    tipo_no_cartao: values.tipo === 'cartao' ? (isParcelado(values) ? 'parcelado' : 'avista') : null,
    parcelamento_id: parcelamentoId,
    parcela_atual: parcelaAtual,
    parcela_total: parcelaTotal,
    status: values.status,
    created_by: userId,
  };
}

export async function criarTransacao(input: TransacaoInsertInput): Promise<Transacao> {
  return criarLancamento(input.household_id, input.created_by, input);
}

export async function criarLancamento(householdId: string, userId: string, values: TransacaoFormValues): Promise<Transacao> {
  if (!isParcelado(values)) {
    const { data, error } = await supabase
      .from('transacoes')
      .insert(transactionPayload(householdId, userId, values, values.data, null, null, null))
      .select('*, categoria:categorias(nome, natureza, cor), conta:contas(nome, instituicao)')
      .single();

    if (error) throw error;
    return data as Transacao;
  }

  const total = values.parcela_total as number;
  const valorParcela = values.valor / total;
  const { data: parcelamento, error: parcelamentoError } = await supabase
    .from('parcelamentos')
    .insert({
      household_id: householdId,
      descricao: values.descricao.trim() || 'Compra parcelada',
      valor_total: values.valor,
      valor_parcela: valorParcela,
      total_parcelas: total,
      data_primeira_parcela: values.data,
      categoria_id: values.categoria_id || null,
      conta_id: values.conta_id || null,
      forma_pagamento: values.forma_pagamento,
      observacao: values.observacao.trim() || null,
      created_by: userId,
    })
    .select('id')
    .single();

  if (parcelamentoError) throw parcelamentoError;

  const rows = Array.from({ length: total }, (_, index) => transactionPayload(
    householdId,
    userId,
    { ...values, valor: valorParcela },
    addMonths(new Date(`${values.data}T12:00:00`), index).toISOString().slice(0, 10),
    parcelamento.id,
    index + 1,
    total,
  ));
  const { data, error } = await supabase
    .from('transacoes')
    .insert(rows)
    .select('*, categoria:categorias(nome, natureza, cor), conta:contas(nome, instituicao)')
    .order('parcela_atual', { ascending: true });

  if (error) throw error;
  return (data?.[0] ?? rows[0]) as Transacao;
}

export async function atualizarTransacao(householdId: string, transacaoId: string, values: TransacaoFormValues): Promise<void> {
  const { error } = await supabase
    .from('transacoes')
    .update({
      tipo: databaseType(values.tipo),
      valor: values.valor,
      data: values.data,
      descricao: values.descricao.trim() || 'Sem descrição',
      observacao: values.observacao.trim() || null,
      categoria_id: values.categoria_id || null,
      conta_id: values.conta_id || null,
      forma_pagamento: values.forma_pagamento,
      status: values.status,
    })
    .eq('id', transacaoId)
    .eq('household_id', householdId);

  if (error) throw error;
}

export async function excluirTransacao(householdId: string, transacaoId: string): Promise<void> {
  const { error } = await supabase.from('transacoes').delete().eq('id', transacaoId).eq('household_id', householdId);
  if (error) throw error;
}

export async function atualizarStatusTransacao(
  householdId: string,
  transacaoId: string,
  status: Transacao['status'],
): Promise<void> {
  const { error } = await supabase
    .from('transacoes')
    .update({ status })
    .eq('id', transacaoId)
    .eq('household_id', householdId);

  if (error) throw error;
}