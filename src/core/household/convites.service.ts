import { supabase } from '@/lib/supabase';
import type {
  AceitarConviteResultado,
  Convite,
  ConvitePapel,
  CriarConviteInput,
} from './convites.types';

export async function listarConvitesDoHousehold(
  householdId: string,
): Promise<Convite[]> {
  const { data, error } = await supabase
    .from('household_convites')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Convite[];
}

export async function criarConvite(
  householdId: string,
  userId: string,
  input: CriarConviteInput,
): Promise<Convite> {
  const email = input.email_convidado.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    throw new Error('Informe um email válido.');
  }

  const { data, error } = await supabase
    .from('household_convites')
    .insert({
      household_id: householdId,
      email_convidado: email,
      convidado_por: userId,
      papel: input.papel,
      status: 'pendente',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um convite pendente para este email nesta família.');
    }
    throw error;
  }

  return data as Convite;
}

export async function cancelarConvite(conviteId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_convite', {
    p_convite_id: conviteId,
  });

  if (error) throw error;
}

export async function buscarConvitePorToken(token: string): Promise<Convite | null> {
  const { data, error } = await supabase
    .from('household_convites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  return (data as Convite | null) ?? null;
}

export async function aceitarConvite(token: string): Promise<AceitarConviteResultado> {
  const { data, error } = await supabase.rpc('aceitar_convite', {
    p_token: token,
  });

  if (error) throw error;
  return data as AceitarConviteResultado;
}

export function montarLinkConvite(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/aceitar-convite?token=${token}`;
}

export const convitePapelLabels: Record<ConvitePapel, string> = {
  admin: 'Administrador',
  membro: 'Membro',
};
