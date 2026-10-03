import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Home, Menu, User, X } from 'lucide-react';
import { MYLIFE_MODULES } from './modules';
import { useHousehold } from '@/core/household/useHousehold';

export default function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const modules = MYLIFE_MODULES.filter((m) => m.enabled);
  const { activeHousehold, households } = useHousehold();
  const navigate = useNavigate();
  const [modulesOpen, setModulesOpen] = useState(true);

  const hasNoHousehold = households.length === 0;
  const householdLabel = activeHousehold?.nome ?? 'Sem família';
  const isPersonalSpace = Boolean(activeHousehold?.nome.match(/\(pessoal\)$/i));
  const destinoFamilia = hasNoHousehold ? '/onboarding' : '/selecionar-familia';

  return (
    <aside aria-label="Navegação principal" className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-canvas-300 bg-white transition-transform duration-200 md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-start justify-between border-b border-canvas-300 px-5 py-5">
        <button
          type="button"
          aria-label="Voltar para a home"
          onClick={() => { navigate('/'); onNavigate(); }}
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
        <button type="button" aria-label="Fechar menu" onClick={onNavigate} className="icon-button md:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => { navigate(destinoFamilia); onNavigate(); }}
          className="w-full rounded-lg border border-canvas-300 bg-white p-3 text-left transition hover:border-canvas-400 hover:bg-canvas-100"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {isPersonalSpace ? <User className="h-4 w-4" /> : <Home className="h-4 w-4" />}
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  {hasNoHousehold ? 'Espaço pessoal' : isPersonalSpace ? 'Espaço pessoal ativo' : 'Família ativa'}
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

      <nav id="primary-navigation" className="flex-1 p-3">
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
                  onClick={onNavigate}
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
