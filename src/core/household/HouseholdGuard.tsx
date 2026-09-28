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
