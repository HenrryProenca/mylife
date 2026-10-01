import { supabase } from '@/lib/supabase';
import type {
  Responsavel,
  ResponsavelInsertInput,
  ResponsavelUpdateInput,
} from '../types/responsaveis.types';
import type { MembroDoHousehold } from '@/core/household/household.service';

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

export async function garantirResponsaveisDosMembros(
  householdId: string,
  membros: Array<Pick<MembroDoHousehold, 'user_id' | 'nome'>>,
): Promise<void> {
  for (const membro of membros) {
    const { data: existente, error } = await supabase
      .from('responsaveis')
      .select('id, nome, user_id')
      .eq('household_id', householdId)
      .eq('user_id', membro.user_id)
      .maybeSingle();
    if (error) throw error;
    if (existente) {
      if (existente.nome !== membro.nome) {
        const { error: updateError } = await supabase.from('responsaveis').update({ nome: membro.nome }).eq('id', existente.id);
        if (updateError) throw updateError;
      }
      continue;
    }

    const { data: responsavelSemVinculo, error: buscaError } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('household_id', householdId)
      .eq('nome', membro.nome)
      .is('user_id', null)
      .maybeSingle();
    if (buscaError) throw buscaError;
    if (responsavelSemVinculo) {
      const { error: vinculoError } = await supabase.from('responsaveis').update({ user_id: membro.user_id, ativo: true }).eq('id', responsavelSemVinculo.id);
      if (vinculoError) throw vinculoError;
      continue;
    }

    const { error: insertError } = await supabase.from('responsaveis').insert({ household_id: householdId, nome: membro.nome, user_id: membro.user_id, ativo: true });
    if (insertError && insertError.code !== '23505') throw insertError;
  }
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
