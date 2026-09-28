import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Home, Menu } from 'lucide-react';
import { MYLIFE_MODULES } from './modules';
import { useHousehold } from '@/core/household/useHousehold';

export default function Sidebar() {
  const modules = MYLIFE_MODULES.filter((m) => m.enabled);
  const { activeHousehold, households } = useHousehold();
  const navigate = useNavigate();
  const [modulesOpen, setModulesOpen] = useState(true);

  const hasNoHousehold = households.length === 0;
  const householdLabel = activeHousehold?.nome ?? 'Sem família';
  const destinoFamilia = hasNoHousehold ? '/onboarding' : '/selecionar-familia';

  return (
    <aside className="w-60 shrink-0 border-r border-canvas-300 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-canvas-300">
        <button
          type="button"
          aria-label="Voltar para a home"
          onClick={() => navigate('/')}
          className="group text-left"
        >
          <div className="font-display text-lg font-semibold tracking-tight">
            <span className="text-ink-900">My</span>
            <span className="text-brand-600">Life</span>
          </div>
          <div className="text-xs text-ink-500 transition group-hover:text-ink-900">
            Sua vida organizada
          </div>
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => navigate(destinoFamilia)}
          className="w-full rounded-xl border border-canvas-300 bg-white p-3 text-left transition hover:border-brand-400 hover:bg-canvas-200"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Home className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  {hasNoHousehold ? 'Minha família' : 'Família ativa'}
                </div>
                <div className="truncate text-sm font-semibold text-ink-900">
                  {householdLabel}
                </div>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-ink-400" />
          </div>
        </button>
      </div>

      <nav className="flex-1 p-3">
        <button
          type="button"
          onClick={() => setModulesOpen((open) => !open)}
          className="mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 transition hover:bg-canvas-200 hover:text-ink-900"
          aria-expanded={modulesOpen}
        >
          <span className="flex items-center gap-2">
            <Menu className="h-4 w-4 text-brand-600" />
            Módulos
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${modulesOpen ? '' : '-rotate-90'}`} />
        </button>

        {modulesOpen
          ? modules.map((mod) => {
              const Icon = mod.icon;

              return (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-500 hover:text-ink-900 hover:bg-canvas-200',
                    ].join(' ')
                  }
                >
                  <Icon className="w-4 h-4" />
                  {mod.label}
                </NavLink>
              );
            })
          : null}
      </nav>
    </aside>
  );
}
