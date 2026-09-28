import type { User } from '@supabase/supabase-js';

export interface Perfil {
  id: string;
  nome: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  isAuthenticated: boolean;
}
