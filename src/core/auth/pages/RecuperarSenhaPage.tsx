import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { enviarEmailRecuperacao } from '../auth.service';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await enviarEmailRecuperacao(email);
      setEnviado(true);
      toast.success('Email enviado! Confira sua caixa de entrada.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar email';
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-[#06121a] mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
          <p className="text-sm text-content-muted mt-1">
            Enviaremos um link de redefinição para o seu email
          </p>
        </div>

        {enviado ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-content-soft">
              Se o email estiver cadastrado, você receberá um link em alguns
              minutos. Verifique também a caixa de spam.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 text-sm text-accent-soft hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card p-6 space-y-4">
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

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-br from-accent to-[#16a34a] text-[#04120a] font-semibold py-2.5 rounded-lg transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {carregando ? 'Enviando…' : 'Enviar link'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-content-muted hover:text-content"
              >
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}