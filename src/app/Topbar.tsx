import { LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { logoutUsuario } from '@/core/auth/auth.service';
import { MYLIFE_MODULES } from './modules';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { perfil, user } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const nomeExibicao = perfil?.nome ?? user?.email ?? 'Usuário';
  const inicial = nomeExibicao.charAt(0).toUpperCase();
  const pagina = MYLIFE_MODULES.find((mod) => pathname.startsWith(mod.path))?.label
    ?? (pathname === '/' ? 'Início' : pathname === '/perfil' ? 'Meu perfil' : 'Família');

  async function handleLogout() {
    try {
      await logoutUsuario();
      toast.success('Você saiu da sua conta.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Erro ao sair');
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-canvas-300 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Abrir menu" aria-controls="primary-navigation" onClick={onMenuClick} className="icon-button md:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{pagina}</p>
          <p className="hidden text-xs text-ink-500 sm:block">MyLife <span className="px-1 text-ink-300">/</span> Espaço de organização</p>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-expanded={menuAberto}
          className="flex items-center gap-2 rounded-md py-1.5 pl-2 pr-1 transition hover:bg-canvas-100 sm:gap-3 sm:pr-3"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt={nomeExibicao} className="h-full w-full rounded-full object-cover" />
            ) : inicial}
          </div>
          <span className="hidden max-w-[160px] truncate text-sm font-medium text-ink-900 sm:inline">
            {nomeExibicao}
          </span>
        </button>

        {menuAberto ? (
          <>
            <button type="button" aria-label="Fechar menu da conta" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuAberto(false)} />
            <div className="card animate-fade-in absolute right-0 top-full z-20 mt-2 w-56 p-1.5">
              <div className="mb-1 border-b border-canvas-300 px-3 py-2">
                <div className="truncate text-sm font-semibold text-ink-900">{nomeExibicao}</div>
                <div className="truncate text-xs text-ink-500">{user?.email}</div>
              </div>

              <button
                type="button"
                onClick={() => { setMenuAberto(false); navigate('/perfil'); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink-500 transition hover:bg-canvas-100 hover:text-ink-900"
              >
                <UserIcon className="h-4 w-4" />Meu perfil
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-state-error transition hover:bg-state-error/10"
              >
                <LogOut className="h-4 w-4" />Sair
              </button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
