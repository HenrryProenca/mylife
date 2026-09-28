import { supabase } from '@/lib/supabase';
import type { Responsavel } from '../types/responsaveis.types';
import { buildSeedResponsaveis } from '../utils/seedResponsaveis';

export async function listarResponsaveisAtivos(householdId: string): Promise<Responsavel[]> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('id, household_id, nome, user_id, ativo')
    .eq('household_id', householdId)
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Responsavel[];
}

export async function garantirResponsaveisPadrao(householdId: string): Promise<void> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('nome')
    .eq('household_id', householdId);

  if (error) throw error;

  const existing = new Set((data ?? []).map((r) => r.nome));
  const missing = buildSeedResponsaveis(householdId).filter((r) => !existing.has(r.nome));

  if (missing.length === 0) return;

  const { error: insertError } = await supabase.from('responsaveis').insert(missing);
  if (insertError) throw insertError;
}
