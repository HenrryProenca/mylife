import { NavLink } from 'react-router-dom';
import { MYLIFE_MODULES } from './modules';
import { env } from '@/lib/env';

export default function Sidebar() {
  const modules = MYLIFE_MODULES.filter((m) => m.enabled);

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card/60 backdrop-blur-sm flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="text-lg font-bold tracking-tight">{env.appName}</div>
        <div className="text-xs text-content-muted">Sua vida organizada</div>
      </div>

      <nav className="p-3 flex-1">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <NavLink
              key={mod.id}
              to={mod.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-content-muted hover:text-content hover:bg-white/5',
                ].join(' ')
              }
            >
              <Icon className="w-4 h-4" />
              {mod.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}