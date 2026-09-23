    import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { loginUsuario } from '../auth.service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const destino = location.state?.from?.pathname ?? '/financeiro';

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
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-[#06121a] mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Entrar no MyLife</h1>
          <p className="text-sm text-content-muted mt-1">
            Acesse sua conta para continuar
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card p-6 space-y-4"
          autoComplete="on"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted">
                Senha
              </label>
              <Link
                to="/recuperar-senha"
                className="text-xs text-accent-soft hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-br from-accent to-[#16a34a] text-[#04120a] font-semibold py-2.5 rounded-lg transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-content-muted mt-6">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-accent-soft hover:underline">
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