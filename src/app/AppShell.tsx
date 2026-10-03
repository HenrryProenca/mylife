import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-100 md:flex">
      {menuMobileAberto ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-ink-900/30 md:hidden"
          onClick={() => setMenuMobileAberto(false)}
        />
      ) : null}
      <Sidebar open={menuMobileAberto} onNavigate={() => setMenuMobileAberto(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuMobileAberto((open) => !open)} />
        <main className="w-full flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
