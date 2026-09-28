import { supabase } from '@/lib/supabase';
import type {
  Responsavel,
  ResponsavelInsertInput,
  ResponsavelUpdateInput,
} from '../types/responsaveis.types';
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

export async function criarResponsavel(
  householdId: string,
  input: ResponsavelInsertInput,
): Promise<Responsavel> {
  const nome = input.nome.trim();

  if (!nome) {
    throw new Error('O nome do responsável é obrigatório.');
  }

  const { data, error } = await supabase
    .from('responsaveis')
    .insert({
      household_id: householdId,
      nome,
      user_id: input.user_id ?? null,
      ativo: input.ativo ?? true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um responsável com este nome nesta família.');
    }
    throw error;
  }

  return data as Responsavel;
}

export async function atualizarResponsavel(
  householdId: string,
  responsavelId: string,
  input: ResponsavelUpdateInput,
): Promise<Responsavel> {
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) {
    const nome = input.nome.trim();
    if (!nome) {
      throw new Error('O nome do responsável não pode ficar em branco.');
    }
    payload.nome = nome;
  }

  if (input.user_id !== undefined) {
    payload.user_id = input.user_id ?? null;
  }

  if (input.ativo !== undefined) {
    payload.ativo = input.ativo;
  }

  const { data, error } = await supabase
    .from('responsaveis')
    .update(payload)
    .eq('id', responsavelId)
    .eq('household_id', householdId)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um responsável com este nome nesta família.');
    }
    throw error;
  }

  return data as Responsavel;
}

export async function excluirResponsavel(
  householdId: string,
  responsavelId: string,
): Promise<void> {
  const { error } = await supabase
    .from('responsaveis')
    .delete()
    .eq('id', responsavelId)
    .eq('household_id', householdId);

  if (error) throw error;
}
