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
      <div className="min-h-screen bg-canvas-100 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Verificando sua família…</div>
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
    <div className="min-h-screen bg-canvas-100 text-ink-900 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Primeiros passos
              </p>
              <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Criar minha família</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
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

            <div className="rounded-lg border border-canvas-300 bg-white p-3 text-sm text-ink-500">
              <span className="font-medium text-ink-900">Sugestão:</span> {suggestedName}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex-1 rounded-lg border border-canvas-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-ink-500 transition hover:bg-canvas-200 hover:text-ink-900"
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
