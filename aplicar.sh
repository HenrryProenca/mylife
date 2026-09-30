#!/usr/bin/env bash

# ============================================================
# Fix — Corrige aceitar convite + auto-login após cadastro
# ============================================================
# O que este script faz:
# - AceitarConvitePage: corrige o loop infinito no useEffect
#   (remove `estado` das deps, adiciona flag de controle)
# - CadastroPage: após criar conta, faz login automático e
#   redireciona para ?redirect= se existir
# - LoginPage: sem mudança (já está correto)
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/core/household/pages/AceitarConvitePage.tsx (sobrescrito)
#   - src/core/auth/pages/CadastroPage.tsx (sobrescrito)
# ============================================================

set -e

mkdir -p src/core/household/pages
mkdir -p src/core/auth/pages

# ---------- ALTERAR: core/household/pages/AceitarConvitePage.tsx ----------
cat << 'EOF' > src/core/household/pages/AceitarConvitePage.tsx
import { useEffect, useRef, useState } from 'react';
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

  const [estado, setEstado] = useState<Estado>(token ? 'verificando' : 'sem-token');
  const [mensagemErro, setMensagemErro] = useState<string>('');

  // Flag de controle para garantir que a RPC é chamada apenas uma vez
  const jaExecutou = useRef(false);

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (isAuthenticated) return;

    const redirect = encodeURIComponent(`/aceitar-convite?token=${token}`);
    navigate(`/login?redirect=${redirect}`, { replace: true });
  }, [authLoading, isAuthenticated, token, navigate]);

  // Aceita o convite quando o usuário está autenticado
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (!isAuthenticated) return;
    if (jaExecutou.current) return;

    jaExecutou.current = true;

    let cancelado = false;

    async function executar() {
      setEstado('aceitando');
      try {
        const resultado = await aceitarConvite(token!);
        if (cancelado) return;

        await refreshHouseholds();
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
  }, [authLoading, isAuthenticated, token, refreshHouseholds, setActiveHousehold, navigate]);

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

# ---------- ALTERAR: core/auth/pages/CadastroPage.tsx ----------
cat << 'EOF' > src/core/auth/pages/CadastroPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { cadastrarUsuario, loginUsuario } from '../auth.service';
import { useAuth } from '../useAuth';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const destinoFinal = redirectParam ? decodeURIComponent(redirectParam) : '/';

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(destinoFinal, { replace: true });
    }
  }, [loading, isAuthenticated, destinoFinal, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    setCarregando(true);

    try {
      // 1. Cria a conta
      await cadastrarUsuario({ nome, email, senha });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
      toast.error(traduzirErro(msg));
      setCarregando(false);
      return;
    }

    try {
      // 2. Tenta fazer login automático
      await loginUsuario({ email, senha });
      toast.success('Conta criada! Bem-vindo ao MyLife.');
      // Se o login automático funcionou, o AuthProvider detecta via onAuthStateChange
      // e o useEffect acima redireciona para destinoFinal
    } catch (err) {
      // Se falhou o login automático (ex: email precisa ser confirmado),
      // manda para login com o redirect preservado
      const msg = err instanceof Error ? err.message : '';
      if (/email not confirmed/i.test(msg)) {
        toast.success('Conta criada! Confirme seu email antes de entrar.');
      } else {
        toast.success('Conta criada! Faça login para continuar.');
      }

      if (redirectParam) {
        navigate(`/login?redirect=${encodeURIComponent(redirectParam)}`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas-100 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Criar conta</h1>
          <p className="text-sm text-ink-500 mt-1">
            Comece a organizar sua vida financeira
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Nome
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="input-base"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-base"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="btn-primary w-full"
          >
            {carregando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Já tem conta?{' '}
          <Link
            to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            className="text-brand-600 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

function traduzirErro(msg: string) {
  if (/already registered|user already/i.test(msg)) return 'Este email já está cadastrado.';
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter no mínimo 6 caracteres.';
  return msg;
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 2 modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. npm run dev             (testa o fluxo completo)"
echo "  4. Se estiver OK: git add . && git commit -m \"fix: corrige aceitar convite e adiciona auto-login no cadastro\" && git push"
echo ""
