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

/**
 * Recusa um convite — mesma ação que cancelar, mas semanticamente diferente.
 * O convidado pode recusar; o owner/admin pode cancelar. Ambos usam a mesma
 * RPC que muda o status para 'cancelado'.
 */
export async function recusarConvite(conviteId: string): Promise<void> {
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

/**
 * Busca o nome de um household a partir do ID.
 * Usado pela tela de aceitar convite para mostrar o nome da família.
 * O RLS já garante que o usuário só vê households aos quais tem acesso,
 * mas como o convidado ainda não é membro, ele não teria acesso — por isso
 * usamos a service_role em contexto de função RPC seria ideal, mas aqui
 * usamos uma query simples que o RLS permite pelo convite vinculado.
 */
export async function buscarNomeDoHousehold(householdId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('households')
    .select('nome')
    .eq('id', householdId)
    .maybeSingle();

  if (error) return null;
  return data?.nome ?? null;
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
  membro: 'Leitura e escrita',
  visualizador: 'Somente visualização',
};
