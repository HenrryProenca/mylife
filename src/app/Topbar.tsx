import { LogOut, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { logoutUsuario } from '@/core/auth/auth.service';

export default function Topbar() {
  const { perfil, user } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();

  const nomeExibicao = perfil?.nome ?? user?.email ?? 'Usuário';
  const inicial = nomeExibicao.charAt(0).toUpperCase();

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
    <header className="h-14 shrink-0 border-b border-canvas-300 bg-white flex items-center justify-between px-6">
      <div className="text-sm text-ink-500">Módulo Financeiro</div>

      <div className="relative">
        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-canvas-200 transition"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center font-bold text-sm">
            {perfil?.avatar_url ? (
              <img
                src={perfil.avatar_url}
                alt={nomeExibicao}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              inicial
            )}
          </div>
          <span className="text-sm font-medium text-ink-900 max-w-[160px] truncate">
            {nomeExibicao}
          </span>
        </button>

        {menuAberto && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuAberto(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-56 card p-1.5 z-20 animate-fade-in">
              <div className="px-3 py-2 border-b border-canvas-300 mb-1">
                <div className="text-sm font-semibold text-ink-900 truncate">
                  {nomeExibicao}
                </div>
                <div className="text-xs text-ink-500 truncate">
                  {user?.email}
                </div>
              </div>

              <button
                onClick={() => {
                  setMenuAberto(false);
                  navigate('/perfil');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink-500 hover:bg-canvas-200 hover:text-ink-900 transition text-left"
              >
                <UserIcon className="w-4 h-4" />
                Meu perfil
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-state-error hover:bg-state-error/10 transition text-left"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}