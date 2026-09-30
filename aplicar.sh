#!/usr/bin/env bash

# ============================================================
# Ajuste — Remove opção "Nenhum espaço"
# ============================================================
# O que este script faz:
# - SelecionarHouseholdPage: remove o botão "Nenhum espaço"
# - HouseholdProvider: nunca mais aplica a sentinela "__sem_familia__"
#   como ativo (mantém o valor salvo por segurança, mas sempre cai
#   no primeiro household se não houver um válido)
#
# Arquivos alterados:
#   - src/core/household/pages/SelecionarHouseholdPage.tsx (sobrescrito)
#   - src/core/household/HouseholdProvider.tsx (sobrescrito)
# ============================================================

set -e

mkdir -p src/core/household/pages

# ---------- ALTERAR: core/household/HouseholdProvider.tsx ----------
cat << 'EOF' > src/core/household/HouseholdProvider.tsx
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/core/auth/useAuth';
import {
  createHousehold,
  deleteHousehold as deleteHouseholdService,
  getStoredActiveHouseholdId,
  listarHouseholdsDoUsuario,
  setStoredActiveHouseholdId,
} from './household.service';
import type {
  CreateHouseholdInput,
  HouseholdContextValue,
  HouseholdWithMembership,
} from './types';

export const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [households, setHouseholds] = useState<HouseholdWithMembership[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeHousehold = useMemo(
    () => households.find((household) => household.id === activeHouseholdId) ?? null,
    [households, activeHouseholdId],
  );

  const aplicarHouseholds = useCallback((householdList: HouseholdWithMembership[]) => {
    setHouseholds(householdList);

    // Sempre escolhe um household ativo:
    // 1. Se o salvo ainda existe na lista, mantém.
    // 2. Senão, usa o primeiro da lista.
    // 3. Só fica null se a lista estiver vazia (não deveria acontecer com o pessoal).
    const storedActiveId = getStoredActiveHouseholdId();
    const nextActiveId =
      storedActiveId && householdList.some((household) => household.id === storedActiveId)
        ? storedActiveId
        : householdList[0]?.id ?? null;

    setActiveHouseholdId(nextActiveId);
    setStoredActiveHouseholdId(nextActiveId);
  }, []);

  const refreshHouseholds = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      setStoredActiveHouseholdId(null);
      return;
    }

    setLoading(true);

    try {
      const householdList = await listarHouseholdsDoUsuario(user.id);
      aplicarHouseholds(householdList);
    } catch (error) {
      console.error('[household] erro ao carregar households:', error);
      setHouseholds([]);
      setActiveHouseholdId(null);
      setStoredActiveHouseholdId(null);
    } finally {
      setLoading(false);
    }
  }, [aplicarHouseholds, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      setStoredActiveHouseholdId(null);
      setLoading(false);
      return;
    }

    void refreshHouseholds();
  }, [authLoading, isAuthenticated, user, refreshHouseholds]);

  const setActiveHousehold = useCallback((householdId: string | null) => {
    setActiveHouseholdId(householdId);
    setStoredActiveHouseholdId(householdId);
  }, []);

  const createHouseholdAction = useCallback(
    async (input: CreateHouseholdInput) => {
      if (!user) {
        throw new Error('É necessário estar autenticado para criar uma família.');
      }

      setCreating(true);

      try {
        const household = await createHousehold(user.id, input);

        setHouseholds((previousHouseholds) => {
          const alreadyExists = previousHouseholds.some(
            (item) => item.id === household.id,
          );

          if (alreadyExists) {
            return previousHouseholds.map((item) =>
              item.id === household.id ? household : item,
            );
          }

          return [...previousHouseholds, household];
        });

        setActiveHouseholdId(household.id);
        setStoredActiveHouseholdId(household.id);

        return household;
      } finally {
        setCreating(false);
      }
    },
    [user],
  );

  const deleteHouseholdAction = useCallback(
    async (householdId: string) => {
      if (!user) {
        throw new Error('É necessário estar autenticado para excluir uma família.');
      }

      setDeleting(true);

      try {
        await deleteHouseholdService(user.id, householdId);
        const householdList = await listarHouseholdsDoUsuario(user.id);
        aplicarHouseholds(householdList);
      } finally {
        setDeleting(false);
      }
    },
    [aplicarHouseholds, user],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      households,
      activeHouseholdId,
      activeHousehold,
      loading: authLoading || loading,
      creating,
      deleting,
      hasHousehold: households.length > 0,
      setActiveHousehold,
      refreshHouseholds,
      createHousehold: createHouseholdAction,
      deleteHousehold: deleteHouseholdAction,
    }),
    [
      households,
      activeHouseholdId,
      activeHousehold,
      authLoading,
      loading,
      creating,
      deleting,
      setActiveHousehold,
      refreshHouseholds,
      createHouseholdAction,
      deleteHouseholdAction,
    ],
  );

  return (
    <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
  );
}
EOF

# ---------- ALTERAR: core/household/pages/SelecionarHouseholdPage.tsx ----------
cat << 'EOF' > src/core/household/pages/SelecionarHouseholdPage.tsx
import { Check, ChevronDown, ChevronRight, Home, Trash2, User, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useHousehold } from '@/core/household/useHousehold';
import { GerenciarFamiliaPanel } from '../components/GerenciarFamiliaPanel';

function ehPessoal(nome: string): boolean {
  return /\(pessoal\)$/i.test(nome);
}

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
          <div className="text-sm text-ink-500">Carregando espaços…</div>
        </div>
      </div>
    );
  }

  function handleSelect(householdId: string) {
    setActiveHousehold(householdId);
    toast.success('Espaço selecionado.');
    navigate('/', { replace: true });
  }

  function handleToggleGerenciar(householdId: string) {
    setGerenciandoId((atual) => (atual === householdId ? null : householdId));
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
                Espaços
              </p>
              <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">
                Selecionar espaço
              </h1>
              <p className="text-xs text-ink-500 mt-1">
                Escolha em qual espaço você quer lançar e visualizar dados
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {households.map((household) => {
              const selected = household.id === activeHouseholdId;
              const gerenciando = gerenciandoId === household.id;
              const pessoal = ehPessoal(household.nome);

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
                            {pessoal ? (
                              <User className="h-4 w-4 text-ink-500" />
                            ) : (
                              <Home className="h-4 w-4 text-brand-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate font-semibold text-ink-900">
                                {household.nome}
                              </span>
                              {pessoal ? (
                                <span className="inline-flex items-center rounded-full border border-canvas-300 bg-canvas-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                  Pessoal
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-ink-500 uppercase tracking-wider">
                              {household.membership.papel}
                            </div>
                          </div>
                        </div>

                        {selected ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            <Check className="h-3.5 w-3.5" />
                            Ativo
                          </span>
                        ) : null}
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label={gerenciando ? 'Fechar gerenciamento' : `Gerenciar ${household.nome}`}
                      title={gerenciando ? 'Fechar' : 'Gerenciar'}
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

                    {household.membership.papel === 'owner' && !pessoal ? (
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
              Criar nova família
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
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 2 modificados)"
echo "  2. npm run typecheck       (confirma que não quebrou tipos)"
echo "  3. npm run dev             (testa a tela)"
echo "  4. Se estiver OK: git add . && git commit -m \"refactor: remove opcao nenhum espaco\" && git push"
echo ""
