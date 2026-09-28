import { Check, ChevronDown, ChevronRight, Home, Minus, Trash2, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useHousehold } from '@/core/household/useHousehold';
import { GerenciarFamiliaPanel } from '../components/GerenciarFamiliaPanel';

export default function SelecionarHouseholdPage() {
  const navigate = useNavigate();
  const [gerenciandoId, setGerenciandoId] = useState<string | null>(null);
  const [familiaParaExcluir, setFamiliaParaExcluir] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const {
    households,
    activeHouseholdId,
    setActiveHousehold,
    deleteHousehold,
    deleting,
    loading,
  } = useHousehold();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-100 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Carregando famílias…</div>
        </div>
      </div>
    );
  }

  function handleSelect(householdId: string) {
    setActiveHousehold(householdId);
    toast.success('Família selecionada.');
    navigate('/', { replace: true });
  }

  function handleToggleGerenciar(householdId: string) {
    setGerenciandoId((atual) => (atual === householdId ? null : householdId));
  }

  function handleClearSelection() {
    setActiveHousehold(null);
    toast.success('Nenhuma família selecionada.');
    navigate('/', { replace: true });
  }

  function solicitarExclusao(householdId: string, householdName: string) {
    setFamiliaParaExcluir({ id: householdId, nome: householdName });
  }

  async function confirmarExclusao() {
    if (!familiaParaExcluir) return;

    try {
      await deleteHousehold(familiaParaExcluir.id);
      setFamiliaParaExcluir(null);
      toast.success('Família excluída.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir a família.';
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-canvas-100 text-ink-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Família
              </p>
              <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">
                Selecionar família
              </h1>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleClearSelection}
              className={[
                'w-full text-left rounded-xl border px-4 py-4 transition',
                activeHouseholdId === null || activeHouseholdId === '__sem_familia__'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-canvas-300 bg-white hover:border-canvas-400',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas-200 border border-canvas-300">
                    <Minus className="h-4 w-4 text-ink-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900">Sem família</div>
                    <div className="text-xs text-ink-500">
                      Usar o app sem selecionar uma família
                    </div>
                  </div>
                </div>
                {activeHouseholdId === null || activeHouseholdId === '__sem_familia__' ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                    <Check className="h-3.5 w-3.5" />
                    Ativa
                  </span>
                ) : null}
              </div>
            </button>

            {households.map((household) => {
              const selected = household.id === activeHouseholdId;
              const gerenciando = gerenciandoId === household.id;

              return (
                <div
                  key={household.id}
                  className={[
                    'rounded-xl border transition',
                    selected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-canvas-300 bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(household.id)}
                      className="min-w-0 flex-1 text-left py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas-200 border border-canvas-300">
                            <Home className="h-4 w-4 text-brand-600" />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ink-900">
                              {household.nome}
                            </div>
                            <div className="text-xs text-ink-500 uppercase tracking-wider">
                              {household.membership.papel}
                            </div>
                          </div>
                        </div>

                        {selected ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            <Check className="h-3.5 w-3.5" />
                            Ativa
                          </span>
                        ) : null}
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label={gerenciando ? 'Fechar gerenciamento' : `Gerenciar ${household.nome}`}
                      title={gerenciando ? 'Fechar' : 'Gerenciar família'}
                      onClick={() => handleToggleGerenciar(household.id)}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-500 transition hover:bg-brand-50 hover:text-brand-600"
                    >
                      {gerenciando ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Fechar
                        </>
                      ) : (
                        <>
                          Gerenciar
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {household.membership.papel === 'owner' ? (
                      <button
                        type="button"
                        aria-label={`Excluir ${household.nome}`}
                        title="Excluir família"
                        disabled={deleting}
                        onClick={() => solicitarExclusao(household.id, household.nome)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition hover:bg-state-error/10 hover:text-state-error disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {gerenciando ? (
                    <div className="border-t border-canvas-300 bg-canvas-50 p-4 animate-fade-in">
                      <GerenciarFamiliaPanel household={household} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between items-center gap-3 text-sm">
            <Link to="/onboarding" className="text-brand-600 hover:underline">
              Criar outra família
            </Link>
            <Link to="/" className="text-ink-500 hover:text-ink-900 transition">
              Voltar
            </Link>
          </div>
        </div>
      </div>

      {familiaParaExcluir ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 px-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setFamiliaParaExcluir(null)}
        >
          <div
            className="card w-full max-w-md p-6 shadow-card-lg animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-exclusao-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption uppercase text-state-error">Atenção</p>
                <h2
                  id="confirmar-exclusao-titulo"
                  className="mt-1 font-display text-h2 font-semibold text-ink-900"
                >
                  Excluir família?
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar confirmação"
                onClick={() => setFamiliaParaExcluir(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-canvas-200 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink-500">
              Você está prestes a excluir a família{' '}
              <strong className="font-semibold text-ink-900">
                {familiaParaExcluir.nome}
              </strong>
              . Essa ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFamiliaParaExcluir(null)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarExclusao()}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-state-error px-4 py-2.5 font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Excluindo…' : 'Excluir família'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
