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
      toast.success('Conta criada! Bem-vindo ao MyLife.');
      navigate('/financeiro', { replace: true });
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-[#06121a] mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
          <p className="text-sm text-content-muted mt-1">
            Comece a organizar sua vida financeira
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
              Nome
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-br from-accent to-[#16a34a] text-[#04120a] font-semibold py-2.5 rounded-lg transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-content-muted mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-accent-soft hover:underline">
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