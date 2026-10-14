import { supabase } from '@/lib/supabase';
import type { Tarefa, TarefaConclusao, TarefaInput } from '../types/tarefas.types';

export async function listarTarefas(householdId: string): Promise<Tarefa[]> {
  const { data, error } = await supabase.from('tarefas').select('*').eq('household_id', householdId).eq('ativa', true).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tarefa[];
}

export async function listarConclusoes(householdId: string, start: string, end: string): Promise<TarefaConclusao[]> {
  const { data, error } = await supabase.from('tarefas_conclusoes').select('*').eq('household_id', householdId).gte('data_referencia', start).lte('data_referencia', end);
  if (error) throw error;
  return (data ?? []) as TarefaConclusao[];
}

export async function criarTarefa(householdId: string, input: TarefaInput): Promise<Tarefa> {
  const { data, error } = await supabase.from('tarefas').insert({ household_id: householdId, ...input, descricao: input.descricao.trim() || null }).select('*').single();
  if (error) throw error;
  return data as Tarefa;
}

export async function excluirTarefa(householdId: string, tarefaId: string): Promise<void> {
  const { error } = await supabase.from('tarefas').update({ ativa: false }).eq('id', tarefaId).eq('household_id', householdId);
  if (error) throw error;
}

export async function definirConclusao(householdId: string, tarefaId: string, dataReferencia: string, concluida: boolean): Promise<void> {
  if (concluida) {
    const { error } = await supabase.from('tarefas_conclusoes').upsert({ household_id: householdId, tarefa_id: tarefaId, data_referencia: dataReferencia }, { onConflict: 'tarefa_id,data_referencia' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('tarefas_conclusoes').delete().eq('household_id', householdId).eq('tarefa_id', tarefaId).eq('data_referencia', dataReferencia);
    if (error) throw error;
  }
}
