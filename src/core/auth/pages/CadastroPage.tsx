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
