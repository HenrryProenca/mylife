import { supabase } from '@/lib/supabase';
import type {
  Categoria,
  CategoriaInsertInput,
  CategoriaUpdateInput,
} from '../types/categorias.types';
import { buildSeedCategorias } from '../utils/seedCategorias';

export async function garantirCategoriasPadrao(householdId: string): Promise<void> {
  const { data, error } = await supabase
    .from('categorias')
    .select('nome, tipo')
    .eq('household_id', householdId);

  if (error) throw error;

  const existing = new Set((data ?? []).map((categoria) => `${categoria.tipo}:${categoria.nome}`));
  const missing = buildSeedCategorias(householdId).filter((categoria) => !existing.has(`${categoria.tipo}:${categoria.nome}`));

  if (missing.length === 0) return;

  const { error: insertError } = await supabase.from('categorias').insert(missing);
  if (insertError) throw insertError;
}

export async function listarCategoriasPorHousehold(
  householdId: string,
): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('household_id', householdId)
    .order('tipo', { ascending: true })
    .order('natureza', { ascending: true })
    .order('nome', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Categoria[];
}

export async function criarCategoria(
  householdId: string,
  input: CategoriaInsertInput,
): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({
      household_id: householdId,
      nome: input.nome.trim(),
      tipo: input.tipo,
      natureza: input.natureza,
      cor: input.cor ?? null,
      icone: input.icone ?? null,
      ativa: input.ativa ?? true,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Categoria;
}

export async function atualizarCategoria(
  householdId: string,
  categoriaId: string,
  input: CategoriaUpdateInput,
): Promise<Categoria> {
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) {
    payload.nome = input.nome.trim();
  }

  if (input.tipo !== undefined) {
    payload.tipo = input.tipo;
  }

  if (input.natureza !== undefined) {
    payload.natureza = input.natureza;
  }

  if (input.cor !== undefined) {
    payload.cor = input.cor ?? null;
  }

  if (input.icone !== undefined) {
    payload.icone = input.icone ?? null;
  }

  if (input.ativa !== undefined) {
    payload.ativa = input.ativa;
  }

  const { data, error } = await supabase
    .from('categorias')
    .update(payload)
    .eq('id', categoriaId)
    .eq('household_id', householdId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Categoria;
}

export async function excluirCategoria(
  householdId: string,
  categoriaId: string,
): Promise<void> {
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', categoriaId)
    .eq('household_id', householdId);

  if (error) {
    throw error;
  }
}
