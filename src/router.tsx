import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './app/AppShell';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import LoginPage from './core/auth/pages/LoginPage';
import CadastroPage from './core/auth/pages/CadastroPage';
import RecuperarSenhaPage from './core/auth/pages/RecuperarSenhaPage';
import RedefinirSenhaPage from './core/auth/pages/RedefinirSenhaPage';
import PerfilPage from './core/usuarios/pages/PerfilPage';
import DashboardPage from './modules/financeiro/pages/DashboardPage';

export const router = createBrowserRouter([
  // ---------- Rotas públicas ----------
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },

  // ---------- Rotas protegidas ----------
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/financeiro" replace /> },
      { path: 'financeiro', element: <DashboardPage /> },
      { path: 'perfil', element: <PerfilPage /> },
      // Próximos passos: financeiro/transacoes, financeiro/categorias, etc.
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);