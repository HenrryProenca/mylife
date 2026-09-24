import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { cadastrarUsuario } from '../auth.service';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-[#06121a] mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="font-display text-h1 font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-content-secondary mt-1">
            Comece a organizar sua vida financeira
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-secondary mb-2">
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
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-secondary mb-2">
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
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-secondary mb-2">
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

        <p className="text-center text-sm text-content-secondary mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand-400 hover:underline">
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