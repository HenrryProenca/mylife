import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthProvider';
import { HouseholdProvider } from './core/household/HouseholdProvider';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <RouterProvider router={router} />
      </HouseholdProvider>
    </AuthProvider>
  );
}