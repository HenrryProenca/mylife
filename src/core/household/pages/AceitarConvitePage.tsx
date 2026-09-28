import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { aceitarConvite } from '../convites.service';
import { useHousehold } from '../useHousehold';

type Estado = 'verificando' | 'aceitando' | 'sucesso' | 'erro' | 'sem-token';

export default function AceitarConvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { refreshHouseholds, setActiveHousehold } = useHousehold();

  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensagemErro, setMensagemErro] = useState<string>('');

  // Se não tem token na URL, mostra erro imediato
  useEffect(() => {
    if (!token) {
      setEstado('sem-token');
    }
  }, [token]);

  // Se o usuário não está logado, redireciona para login com o token preservado
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (isAuthenticated) return;

    const redirect = encodeURIComponent(`/aceitar-convite?token=${token}`);
    navigate(`/login?redirect=${redirect}`, { replace: true });
  }, [authLoading, isAuthenticated, token, navigate]);

  // Se está logado e tem token, aceita automaticamente
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (!isAuthenticated) return;
    if (estado !== 'verificando') return;

    let cancelado = false;

    async function executar() {
      setEstado('aceitando');
      try {
        const resultado = await aceitarConvite(token!);
        if (cancelado) return;

        // Atualiza a lista de households no provider
        await refreshHouseholds();
        // Seleciona o household recém aceito
        setActiveHousehold(resultado.household_id);

        setEstado('sucesso');
        toast.success('Convite aceito! Bem-vindo à família.');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } catch (error) {
        if (cancelado) return;
        const msg = error instanceof Error ? error.message : 'Não foi possível aceitar o convite.';
        setMensagemErro(msg);
        setEstado('erro');
      }
    }

    void executar();

    return () => {
      cancelado = true;
    };
  }, [authLoading, isAuthenticated, token, estado, refreshHouseholds, setActiveHousehold, navigate]);

  // -------------------- RENDER --------------------

  if (estado === 'sem-token') {
    return (
      <TelaCentral>
        <Icone tipo="erro" />
        <Titulo>Link inválido</Titulo>
        <Texto>
          Este link não contém um token de convite. Peça um novo link para quem te convidou.
        </Texto>
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
          <Link to="/selecionar-familia" className="btn-primary">
            Ver minhas famílias
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

  return (
    <TelaCentral>
      <Icone tipo="carregando" />
      <Titulo>{estado === 'aceitando' ? 'Aceitando convite…' : 'Verificando convite…'}</Titulo>
      <Texto>Aguarde um instante.</Texto>
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
