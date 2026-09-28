#!/usr/bin/env bash

# ============================================================
# Tarefa: Migrar paleta do ProtectedRoute e HouseholdGuard
# ============================================================
# O que este script faz:
# - Atualiza os tokens de paleta dos spinners e textos de loading
#   nesses dois arquivos, que ainda usavam navy-* / content-*
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/core/auth/ProtectedRoute.tsx (sobrescrito)
#   - src/core/household/HouseholdGuard.tsx (sobrescrito)
# ============================================================

set -e

# --- src/core/auth/ProtectedRoute.tsx ---
cat << 'EOF' > src/core/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Carregando…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
EOF

# --- src/core/household/HouseholdGuard.tsx ---
cat << 'EOF' > src/core/household/HouseholdGuard.tsx
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from './useHousehold';

export function HouseholdGuard() {
  const { loading: authLoading } = useAuth();
  const { loading: householdLoading } = useHousehold();

  if (authLoading || householdLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-canvas-300 border-t-brand-600 animate-spin" />
          <div className="text-sm text-ink-500">Carregando sua família…</div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git diff"
echo "  2. Se estiver OK: git add . && git commit -m \"style: migra paleta de ProtectedRoute e HouseholdGuard\" && git push"
echo ""
