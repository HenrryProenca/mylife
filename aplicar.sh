#!/usr/bin/env bash

# ============================================================
# Bloco A — Remoções e limpezas
# ============================================================
# O que este script faz:
# - Remove a página CategoriasPage e sua rota
# - Remove 3 componentes órfãos (CategoriaForm, CategoriaList, CategoriaItem)
# - Remove wrapper redundante no HouseholdProvider
# - Remove atualizarStatus não usado no useTransacoes
# - Remove tipos não usados em auth/types
# - Remove variantes não usadas do Badge
#
# Arquivos deletados:
#   - src/modules/financeiro/pages/CategoriasPage.tsx
#   - src/modules/financeiro/components/CategoriaForm.tsx
#   - src/modules/financeiro/components/CategoriaList.tsx
#   - src/modules/financeiro/components/CategoriaItem.tsx
#
# Arquivos alterados:
#   - src/router.tsx (sobrescrito)
#   - src/core/household/HouseholdProvider.tsx (sobrescrito)
#   - src/modules/financeiro/hooks/useTransacoes.ts (sobrescrito)
#   - src/core/auth/types.ts (sobrescrito)
#   - src/components/ui/Badge.tsx (sobrescrito)
# ============================================================

set -e

# ---------- Deletar arquivos ----------
rm -f src/modules/financeiro/pages/CategoriasPage.tsx
rm -f src/modules/financeiro/components/CategoriaForm.tsx
rm -f src/modules/financeiro/components/CategoriaList.tsx
rm -f src/modules/financeiro/components/CategoriaItem.tsx

# ---------- src/router.tsx ----------
cat << 'EOF' > src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './app/AppShell';
import HomePage from './app/HomePage';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import LoginPage from './core/auth/pages/LoginPage';
import CadastroPage from './core/auth/pages/CadastroPage';
import RecuperarSenhaPage from './core/auth/pages/RecuperarSenhaPage';
import RedefinirSenhaPage from './core/auth/pages/RedefinirSenhaPage';
import { HouseholdGuard } from './core/household/HouseholdGuard';
import OnboardingPage from './core/household/pages/OnboardingPage';
import SelecionarHouseholdPage from './core/household/pages/SelecionarHouseholdPage';
import PerfilPage from './core/usuarios/pages/PerfilPage';
import DashboardPage from './modules/financeiro/pages/DashboardPage';
import ListaMercadoPage from './modules/lista-mercado/pages/ListaMercadoPage';

export const router = createBrowserRouter([
  // ---------- Rotas públicas ----------
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },

  // ---------- Rotas protegidas ----------
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'selecionar-familia', element: <SelecionarHouseholdPage /> },
      {
        path: '',
        element: <HouseholdGuard />,
        children: [
          {
            path: '',
            element: <AppShell />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'financeiro', element: <DashboardPage /> },
              { path: 'lista-mercado', element: <ListaMercadoPage /> },
              { path: 'perfil', element: <PerfilPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
EOF

# ---------- src/core/household/HouseholdProvider.tsx ----------
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
  NO_ACTIVE_HOUSEHOLD_ID,
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

    const storedActiveId = getStoredActiveHouseholdId();
    const nextActiveId =
      storedActiveId === NO_ACTIVE_HOUSEHOLD_ID
        ? NO_ACTIVE_HOUSEHOLD_ID
        : storedActiveId && householdList.some((household) => household.id === storedActiveId)
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

# ---------- src/modules/financeiro/hooks/useTransacoes.ts ----------
cat << 'EOF' > src/modules/financeiro/hooks/useTransacoes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';
import {
  atualizarTransacao,
  criarTransacao,
  excluirTransacao,
  listarTransacoes,
} from '../services/transacoes.service';
import type { Transacao, TransacaoFormValues, TransacaoInsertInput } from '../types/transacoes.types';

export const transacoesQueryKey = ['transacoes'];

export function useTransacoes(inicio?: string, fim?: string) {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...transacoesQueryKey, householdId, inicio, fim],
    enabled: Boolean(householdId),
    queryFn: () => listarTransacoes(householdId as string, inicio, fim),
  });

  const createMutation = useMutation({
    mutationFn: (values: TransacaoFormValues) => {
      if (!householdId || !user) throw new Error('Você precisa selecionar uma família e estar autenticado.');
      const input: TransacaoInsertInput = { ...values, household_id: householdId, created_by: user.id };
      return criarTransacao(input);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransacaoFormValues }) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de editar o lançamento.');
      return atualizarTransacao(householdId, id, values);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!householdId) throw new Error('Você precisa selecionar uma família antes de excluir o lançamento.');
      return excluirTransacao(householdId, id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: transacoesQueryKey }),
  });

  return {
    transacoes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    criarTransacao: createMutation.mutateAsync,
    atualizarTransacao: updateMutation.mutateAsync,
    excluirTransacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
EOF

# ---------- src/core/auth/types.ts ----------
cat << 'EOF' > src/core/auth/types.ts
import type { User } from '@supabase/supabase-js';

export interface Perfil {
  id: string;
  nome: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  isAuthenticated: boolean;
}
EOF

# ---------- src/components/ui/Badge.tsx ----------
cat << 'EOF' > src/components/ui/Badge.tsx
import type { ReactNode } from 'react';

type BadgeVariant = 'brand' | 'success' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const classesByVariant: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-state-success/15 text-state-success border-state-success/30',
  neutral: 'bg-canvas-200 text-ink-500 border-canvas-300',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classesByVariant[variant]}`}
    >
      {children}
    </span>
  );
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status              (deve listar 4 arquivos deletados + 5 modificados)"
echo "  2. npm run dev             (confirma que o app sobe)"
echo "  3. Testar o app no navegador: login, dashboard, modal de categorias"
echo "  4. Se estiver OK: git add . && git commit -m \"refactor: remove CategoriasPage, componentes órfãos e código morto\" && git push"
echo ""
