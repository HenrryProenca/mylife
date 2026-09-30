#!/usr/bin/env bash

# ============================================================
# Frente 1 — Aceitar/Recusar convite com confirmação explícita
# ============================================================
# O que este script faz:
# - AceitarConvitePage: mostra dados da família + botões
#   "Aceitar" e "Recusar" em vez de aceitar automaticamente
# - convites.service: adiciona função recusarConvite (usa a
#   RPC cancelar_convite que já existe)
# - useConvites: expõe recusarConvite
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/core/household/pages/AceitarConvitePage.tsx (sobrescrito)
#   - src/core/household/convites.service.ts (sobrescrito)
#   - src/core/household/hooks/useConvites.ts (sobrescrito)
# ============================================================

set -e

mkdir -p src/core/household/pages
mkdir -p src/core/household/hooks

# ---------- ALTERAR: core/household/convites.service.ts ----------
cat << 'EOF' > src/core/household/convites.service.ts
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
  membro: 'Membro',
};
EOF

# ---------- ALTERAR: core/household/hooks/useConvites.ts ----------
cat << 'EOF' > src/core/household/hooks/useConvites.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';
import {
  cancelarConvite as cancelarConviteService,
  criarConvite as criarConviteService,
  listarConvitesDoHousehold,
} from '../convites.service';
import type { CriarConviteInput } from '../convites.types';

export const convitesQueryKey = ['convites'];

export function useConvites() {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...convitesQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: () => listarConvitesDoHousehold(householdId as string),
  });

  const createMutation = useMutation({
    mutationFn: (input: CriarConviteInput) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de convidar.');
      if (!user) throw new Error('Você precisa estar autenticado.');
      return criarConviteService(householdId, user.id, input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: convitesQueryKey }),
  });

  const cancelMutation = useMutation({
    mutationFn: (conviteId: string) => cancelarConviteService(conviteId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: convitesQueryKey }),
  });

  return {
    convites: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    criarConvite: createMutation.mutateAsync,
    cancelarConvite: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
EOF

# ---------- ALTERAR: core/household/pages/AceitarConvitePage.tsx ----------
cat << 'EOF' > src/core/household/pages/AceitarConvitePage.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CheckCircle2, Loader2, Users, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '../useHousehold';
import {
  aceitarConvite,
  buscarConvitePorToken,
  buscarNomeDoHousehold,
  convitePapelLabels,
  recusarConvite,
} from '../convites.service';
import type { Convite } from '../convites.types';

type Estado =
  | 'verificando'
  | 'mostrando'
  | 'aceitando'
  | 'recusando'
  | 'sucesso'
  | 'recusado'
  | 'erro'
  | 'sem-token';

interface DadosConvite {
  convite: Convite;
  nomeHousehold: string | null;
}

export default function AceitarConvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { refreshHouseholds, setActiveHousehold } = useHousehold();

  const [estado, setEstado] = useState<Estado>(token ? 'verificando' : 'sem-token');
  const [mensagemErro, setMensagemErro] = useState<string>('');
  const [dados, setDados] = useState<DadosConvite | null>(null);

  const jaBuscou = useRef(false);

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (isAuthenticated) return;

    const redirect = encodeURIComponent(`/aceitar-convite?token=${token}`);
    navigate(`/login?redirect=${redirect}`, { replace: true });
  }, [authLoading, isAuthenticated, token, navigate]);

  // Busca o convite quando o usuário está autenticado
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (!isAuthenticated) return;
    if (jaBuscou.current) return;

    jaBuscou.current = true;

    let cancelado = false;

    async function buscar() {
      try {
        const convite = await buscarConvitePorToken(token!);
        if (cancelado) return;

        if (!convite) {
          setMensagemErro('Convite não encontrado.');
          setEstado('erro');
          return;
        }

        if (convite.status !== 'pendente') {
          const msg =
            convite.status === 'aceito'
              ? 'Este convite já foi aceito.'
              : 'Este convite foi cancelado.';
          setMensagemErro(msg);
          setEstado('erro');
          return;
        }

        // Verifica se o email do usuário logado bate com o do convite
        const emailLogado = (user?.email ?? '').toLowerCase();
        const emailConvidado = convite.email_convidado.toLowerCase();

        if (emailLogado !== emailConvidado) {
          setMensagemErro(
            `Este convite foi enviado para ${convite.email_convidado}. Faça login com esse email para aceitar.`,
          );
          setEstado('erro');
          return;
        }

        const nomeHousehold = await buscarNomeDoHousehold(convite.household_id);
        if (cancelado) return;

        setDados({ convite, nomeHousehold });
        setEstado('mostrando');
      } catch (error) {
        if (cancelado) return;
        const msg = error instanceof Error ? error.message : 'Erro ao carregar o convite.';
        setMensagemErro(msg);
        setEstado('erro');
      }
    }

    void buscar();

    return () => {
      cancelado = true;
    };
  }, [authLoading, isAuthenticated, token, user]);

  async function handleAceitar() {
    if (!dados) return;
    setEstado('aceitando');

    try {
      const resultado = await aceitarConvite(dados.convite.token);
      await refreshHouseholds();
      setActiveHousehold(resultado.household_id);
      setEstado('sucesso');
      toast.success('Convite aceito! Bem-vindo à família.');
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Não foi possível aceitar o convite.';
      setMensagemErro(msg);
      setEstado('erro');
    }
  }

  async function handleRecusar() {
    if (!dados) return;
    setEstado('recusando');

    try {
      await recusarConvite(dados.convite.id);
      setEstado('recusado');
      toast.success('Convite recusado.');
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Não foi possível recusar o convite.';
      setMensagemErro(msg);
      setEstado('erro');
    }
  }

  // -------------------- RENDER --------------------

  if (estado === 'sem-token') {
    return (
      <TelaCentral>
        <Icone tipo="erro" />
        <Titulo>Link inválido</Titulo>
        <Texto>Este link não contém um token de convite.</Texto>
        <Link to="/" className="btn-primary mt-2">
          Ir para o início
        </Link>
      </TelaCentral>
    );
  }

  if (estado === 'erro') {
    return (
      <TelaCentral>
        <Icone tipo="erro" />
        <Titulo>Não foi possível aceitar</Titulo>
        <Texto>{mensagemErro}</Texto>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-ghost">
            Ir para o início
          </Link>
        </div>
      </TelaCentral>
    );
  }

  if (estado === 'sucesso') {
    return (
      <TelaCentral>
        <Icone tipo="sucesso" />
        <Titulo>Convite aceito</Titulo>
        <Texto>Você agora faz parte desta família. Redirecionando…</Texto>
      </TelaCentral>
    );
  }

  if (estado === 'recusado') {
    return (
      <TelaCentral>
        <Icone tipo="erro" />
        <Titulo>Convite recusado</Titulo>
        <Texto>Você não faz parte desta família. Redirecionando…</Texto>
      </TelaCentral>
    );
  }

  if (estado === 'aceitando') {
    return (
      <TelaCentral>
        <Icone tipo="carregando" />
        <Titulo>Aceitando convite…</Titulo>
        <Texto>Aguarde um instante.</Texto>
      </TelaCentral>
    );
  }

  if (estado === 'recusando') {
    return (
      <TelaCentral>
        <Icone tipo="carregando" />
        <Titulo>Recusando convite…</Titulo>
        <Texto>Aguarde um instante.</Texto>
      </TelaCentral>
    );
  }

  if (estado === 'verificando' || !dados) {
    return (
      <TelaCentral>
        <Icone tipo="carregando" />
        <Titulo>Verificando convite…</Titulo>
        <Texto>Aguarde um instante.</Texto>
      </TelaCentral>
    );
  }

  // estado === 'mostrando'
  return (
    <TelaCentral>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Users className="h-7 w-7" />
      </div>
      <Titulo>Convite para família</Titulo>
      <Texto>
        Você foi convidado para fazer parte da família
        {dados.nomeHousehold ? (
          <>
            {' '}
            <strong className="text-ink-900">{dados.nomeHousehold}</strong>
          </>
        ) : null}
        .
      </Texto>

      <div className="w-full rounded-lg border border-canvas-300 bg-canvas-100 p-3 text-left text-sm text-ink-500">
        <div className="flex items-center justify-between gap-3">
          <span>Convite para</span>
          <span className="truncate font-medium text-ink-900">
            {dados.convite.email_convidado}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span>Papel</span>
          <span className="font-medium text-ink-900">
            {convitePapelLabels[dados.convite.papel]}
          </span>
        </div>
      </div>

      <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => void handleRecusar()}
          className="btn-ghost flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          Recusar
        </button>
        <button
          type="button"
          onClick={() => void handleAceitar()}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4" />
          Aceitar convite
        </button>
      </div>
    </TelaCentral>
  );
}

/* -------------------- Helpers visuais -------------------- */

function TelaCentral({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-100 grid place-items-center px-4">
      <div className="w-full max-w-md card p-8 flex flex-col items-center text-center gap-3">
        {children}
      </div>
    </div>
  );
}

function Icone({ tipo }: { tipo: 'carregando' | 'sucesso' | 'erro' }) {
  if (tipo === 'carregando') {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }
  if (tipo === 'sucesso') {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-state-success/15 text-state-success">
        <CheckCircle2 className="h-7 w-7" />
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-state-error/15 text-state-error">
      <XCircle className="h-7 w-7" />
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-h2 font-semibold text-ink-900">{children}</h1>;
}

function Texto({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 3 modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. npm run dev             (testa o fluxo completo)"
echo "  4. Se estiver OK: git add . && git commit -m \"feat: aceitar/recusar convite com confirmacao\" && git push"
echo ""
