#!/usr/bin/env bash

# ============================================================
# Bloco E — Ajustes de fluxo
# ============================================================
# O que este script faz:
# - RedefinirSenhaPage: navega para / em vez de /financeiro
# - LoginPage: redireciona para / se já autenticado
# - CadastroPage: redireciona para / se já autenticado
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/core/auth/pages/RedefinirSenhaPage.tsx (sobrescrito)
#   - src/core/auth/pages/LoginPage.tsx (sobrescrito)
#   - src/core/auth/pages/CadastroPage.tsx (sobrescrito)
# ============================================================

set -e

# --- src/core/auth/pages/RedefinirSenhaPage.tsx ---
cat << 'EOF' > src/core/auth/pages/RedefinirSenhaPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { atualizarSenha } from '../auth.service';

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let code = params.get('code');

    if (!code && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      code = hashParams.get('code');
    }

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao trocar código por sessão:', error);
            toast.error('Link inválido ou expirado. Solicite um novo.');
            navigate('/login');
          } else {
            setSessaoPronta(true);
          }
        });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessaoPronta(true);
        } else {
          toast.error('Link inválido. Solicite um novo email de recuperação.');
          navigate('/login');
        }
      });
    }
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirma) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setCarregando(true);
    try {
      await atualizarSenha(senha);
      toast.success('Senha atualizada com sucesso!');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar senha';
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  }

  if (!sessaoPronta) {
    return (
      <div className="min-h-screen bg-canvas-100 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Verificando link…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-100 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Definir nova senha</h1>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Nova senha
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

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Confirmar senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              className="input-base"
              placeholder="Repita a senha"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="btn-primary w-full"
          >
            {carregando ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
EOF

# --- src/core/auth/pages/LoginPage.tsx ---
cat << 'EOF' > src/core/auth/pages/LoginPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const destino = location.state?.from?.pathname ?? '/';
  const { isAuthenticated, loading } = useAuth();

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
          <Link to="/cadastro" className="text-brand-600 hover:underline">
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

# --- src/core/auth/pages/CadastroPage.tsx ---
cat << 'EOF' > src/core/auth/pages/CadastroPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { cadastrarUsuario } from '../auth.service';
import { useAuth } from '../useAuth';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      await cadastrarUsuario({ nome, email, senha });
      toast.success('Conta criada! Faça login para continuar.');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
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
          <Link to="/login" className="text-brand-600 hover:underline">
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
echo "  1. git diff                (confere as mudanças)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. Testar no navegador: logout + /login autenticado + redefinir senha"
echo "  4. Se estiver OK: git add . && git commit -m \"feat: ajusta fluxos de login, cadastro e redefinição de senha\" && git push"
echo ""
