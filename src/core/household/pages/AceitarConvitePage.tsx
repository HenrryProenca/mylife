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

  // Primitivos estáveis para usar em dependências (evitam loops)
  const emailLogado = (user?.email ?? '').toLowerCase();

  // ---------- Redireciona para login se não autenticado ----------
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (isAuthenticated) return;

    const redirect = encodeURIComponent(`/aceitar-convite?token=${token}`);
    navigate(`/login?redirect=${redirect}`, { replace: true });
  }, [authLoading, isAuthenticated, token, navigate]);

  // ---------- Busca o convite quando o usuário está autenticado ----------
  // Roda UMA vez por token. Usa `jaBuscou.current` para garantir.
  // NÃO usa flag `cancelado` — assim o setState nunca é engolido.
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (!isAuthenticated) return;
    if (!emailLogado) return;
    if (jaBuscou.current) return;

    jaBuscou.current = true;

    async function buscar() {
      try {
        const convite = await buscarConvitePorToken(token as string);

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

        const emailConvidado = convite.email_convidado.toLowerCase();

        if (emailLogado !== emailConvidado) {
          setMensagemErro(
            `Este convite foi enviado para ${convite.email_convidado}. Faça login com esse email para aceitar.`,
          );
          setEstado('erro');
          return;
        }

        const nomeHousehold = await buscarNomeDoHousehold(convite.household_id);

        setDados({ convite, nomeHousehold });
        setEstado('mostrando');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao carregar o convite.';
        setMensagemErro(msg);
        setEstado('erro');
      }
    }

    void buscar();
  }, [authLoading, isAuthenticated, token, emailLogado]);

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
