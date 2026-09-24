import { supabase } from '@/lib/supabase';
import type { Conta } from '../types/contas.types';

export async function listarContasAtivas(householdId: string): Promise<Conta[]> {
  const { data, error } = await supabase
    .from('contas')
    .select('id, household_id, nome, tipo, instituicao, ativa')
    .eq('household_id', householdId)
    .eq('ativa', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Conta[];
}
