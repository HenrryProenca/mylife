import { supabase } from '@/lib/supabase';
import type { Perfil } from './types';

export async function cadastrarUsuario(params: {
  nome: string;
  email: string;
  senha: string;
}) {
  const { nome, email, senha } = params;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
    },
  });

  if (error) throw error;
  return data;
}

export async function loginUsuario(params: { email: string; senha: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.senha,
  });
  if (error) throw error;
  return data;
}

export async function logoutUsuario() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function enviarEmailRecuperacao(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,  
  });
  if (error) throw error;
}

export async function atualizarSenha(novaSenha: string) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw error;
}

export async function buscarPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}