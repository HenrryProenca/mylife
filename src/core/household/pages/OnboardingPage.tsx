import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const { createHousehold, creating, loading } = useHousehold();

  const suggestedName = useMemo(() => {
    const firstName = perfil?.nome?.trim().split(/\s+/)[0] ?? 'Minha';
    return `Família ${firstName}`;
  }, [perfil]);

  const [nome, setNome] = useState(suggestedName);

  useEffect(() => {
    if (!nome.trim() || nome === 'Família') {
      setNome(suggestedName);
    }
  }, [nome, suggestedName]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-navy-600 border-t-brand-400 animate-spin" />
          <div className="text-sm text-content-secondary">Verificando sua família…</div>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valor = nome.trim();

    if (!valor) {
      toast.error('Informe um nome para a família.');
      return;
    }

    try {
      await createHousehold({ nome: valor });
      toast.success('Família criada com sucesso.');
      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar a família.';
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 text-content-primary px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-[#04120a]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-content-secondary">
                Primeiros passos
              </p>
              <h1 className="font-display text-h1 font-semibold tracking-tight">Criar minha família</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-content-secondary mb-2">
                Nome da família
              </label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder={suggestedName}
                className="input-base"
                autoFocus
              />
            </div>

            <div className="rounded-lg border border-navy-600 bg-navy-800/60 p-3 text-sm text-content-secondary">
              <span className="font-medium text-content-primary">Sugestão:</span> {suggestedName}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-center text-sm font-medium text-content-secondary transition hover:text-content-primary"
              >
                Voltar para a home
              </Link>

              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1"
              >
                {creating ? 'Criando família…' : 'Criar família'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
