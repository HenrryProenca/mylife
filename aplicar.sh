#!/usr/bin/env bash

# ============================================================
# Bloco G1-e — Tela /aceitar-convite
# ============================================================
# O que este script faz:
# - Cria a tela que recebe o convidado
# - Adiciona a rota pública /aceitar-convite no router
# - Ajusta LoginPage para preservar ?redirect= após login
#
# Arquivos criados:
#   - src/core/household/pages/AceitarConvitePage.tsx
#
# Arquivos alterados:
#   - src/router.tsx (sobrescrito)
#   - src/core/auth/pages/LoginPage.tsx (sobrescrito)
# ============================================================

set -e

mkdir -p src/core/household/pages
mkdir -p src/core/auth/pages

# ---------- CRIAR: core/household/pages/AceitarConvitePage.tsx ----------
cat << 'EOF' > src/core/household/pages/AceitarConvitePage.tsx
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
EOF

# ---------- ALTERAR: src/router.tsx ----------
cat << 'EOF' > src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './app/AppShell';
import HomePage from './app/HomePage';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import LoginPage from './core/auth/pages/LoginPage';
import CadastroPage from './core/auth/pages/CadastroPage';
import RecuperarSenhaPage from './core/auth/pages/RecuperarSenhaPage';
import RedefinirSenhaPage from './core/auth/pages/RedefinirSenhaPage';
import { HouseholdGuard } from './core/household/HouseholdGuard';
import OnboardingPage from './core/household/pages/OnboardingPage';
import SelecionarHouseholdPage from './core/household/pages/SelecionarHouseholdPage';
import AceitarConvitePage from './core/household/pages/AceitarConvitePage';
import PerfilPage from './core/usuarios/pages/PerfilPage';
import DashboardPage from './modules/financeiro/pages/DashboardPage';
import ListaMercadoPage from './modules/lista-mercado/pages/ListaMercadoPage';

export const router = createBrowserRouter([
  // ---------- Rotas públicas ----------
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
  { path: '/aceitar-convite', element: <AceitarConvitePage /> },

  // ---------- Rotas protegidas ----------
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'selecionar-familia', element: <SelecionarHouseholdPage /> },
      {
        path: '',
        element: <HouseholdGuard />,
        children: [
          {
            path: '',
            element: <AppShell />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'financeiro', element: <DashboardPage /> },
              { path: 'lista-mercado', element: <ListaMercadoPage /> },
              { path: 'perfil', element: <PerfilPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
EOF

# ---------- ALTERAR: src/core/auth/pages/LoginPage.tsx ----------
cat << 'EOF' > src/core/auth/pages/LoginPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { loginUsuario } from '../auth.service';
import { useAuth } from '../useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  // Destino após login: prioridade para ?redirect=, depois location.state.from, depois /
  const redirectParam = searchParams.get('redirect');
  const destino = redirectParam
    ? decodeURIComponent(redirectParam)
    : location.state?.from?.pathname ?? '/';

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(destino, { replace: true });
    }
  }, [loading, isAuthenticated, destino, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await loginUsuario({ email, senha });
      toast.success('Bem-vindo de volta!');
      navigate(destino, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar';
      toast.error(traduzirErro(msg));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas-100 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Entrar no MyLife</h1>
          <p className="text-sm text-ink-500 mt-1">
            Acesse sua conta para continuar
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card p-6 space-y-4"
          autoComplete="on"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500">
                Senha
              </label>
              <Link
                to="/recuperar-senha"
                className="text-xs text-brand-600 hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="btn-primary w-full"
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Não tem conta?{' '}
          <Link
            to={redirectParam ? `/cadastro?redirect=${encodeURIComponent(redirectParam)}` : '/cadastro'}
            className="text-brand-600 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

function traduzirErro(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Email ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'Confirme seu email antes de entrar.';
  return msg;
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 1 novo + 2 modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. npm run dev             (testa o fluxo completo)"
echo "  4. Se estiver OK: git add . && git commit -m \"feat: tela de aceitar convite\" && git push"
echo ""
