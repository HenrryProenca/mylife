import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './app/AppShell';
import HomePage from './app/HomePage';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import LoginPage from './core/auth/pages/LoginPage';
import CadastroPage from './core/auth/pages/CadastroPage';
import RecuperarSenhaPage from './core/auth/pages/RecuperarSenhaPage';
import RedefinirSenhaPage from './core/auth/pages/RedefinirSenhaPage';
import { HouseholdGuard } from './core/household/HouseholdGuard';
import OnboardingPage from './core/household/pages/OnboardingPage';
import SelecionarHouseholdPage from './core/household/pages/SelecionarHouseholdPage';
import PerfilPage from './core/usuarios/pages/PerfilPage';
import DashboardPage from './modules/financeiro/pages/DashboardPage';
import ListaMercadoPage from './modules/lista-mercado/pages/ListaMercadoPage';

export const router = createBrowserRouter([
  // ---------- Rotas públicas ----------
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },

  // ---------- Rotas protegidas ----------
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'selecionar-familia', element: <SelecionarHouseholdPage /> },
      {
        path: '',
        element: <HouseholdGuard />,
        children: [
          {
            path: '',
            element: <AppShell />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'financeiro', element: <DashboardPage /> },
              { path: 'lista-mercado', element: <ListaMercadoPage /> },
              { path: 'perfil', element: <PerfilPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
