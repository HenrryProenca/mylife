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
    <aside className="w-60 shrink-0 border-r border-navy-600 bg-navy-800/60 backdrop-blur-sm flex flex-col">
      <div className="px-5 py-5 border-b border-navy-600">
        <button
          type="button"
          aria-label="Voltar para a home"
          onClick={() => navigate('/')}
          className="group text-left"
        >
          <div className="font-display text-lg font-semibold tracking-tight">
          <span className="text-content-primary">My</span>
          <span className="text-brand-600">Life</span>
          </div>
          <div className="text-xs text-content-secondary transition group-hover:text-content-primary">
            Sua vida organizada
          </div>
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => navigate(destinoFamilia)}
          className="w-full rounded-xl border border-navy-600 bg-navy-800/60 p-3 text-left transition hover:border-brand-400/40 hover:bg-navy-800"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400">
                <Home className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-content-secondary">
                  {hasNoHousehold ? 'Minha família' : 'Família ativa'}
                </div>
                <div className="truncate text-sm font-semibold text-content-primary">
                  {householdLabel}
                </div>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-content-secondary" />
          </div>
        </button>
      </div>

      <nav className="flex-1 p-3">
        <button
          type="button"
          onClick={() => setModulesOpen((open) => !open)}
          className="mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-content-secondary transition hover:bg-navy-700/60 hover:text-content-primary"
          aria-expanded={modulesOpen}
        >
          <span className="flex items-center gap-2"><Menu className="h-4 w-4 text-brand-400" />Módulos</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${modulesOpen ? '' : '-rotate-90'}`} />
        </button>

        {modulesOpen ? modules.map((mod) => {
          const Icon = mod.icon;

          return (
            <div key={mod.id}>
              <NavLink
                to={mod.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-600/15 text-brand-600'
                      : 'text-content-secondary hover:text-content-primary hover:bg-navy-700/50',
                  ].join(' ')
                }
              >
                <Icon className="w-4 h-4" />
                {mod.label}
              </NavLink>

            </div>
          );
        }) : null}
      </nav>
    </aside>
  );
}