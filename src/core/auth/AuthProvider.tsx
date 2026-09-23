import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { buscarPerfil } from './auth.service';
import type { AuthState, Perfil } from './types';

export interface AuthContextValue extends AuthState {
  refreshPerfil: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async (u: User | null) => {
    if (!u) {
      setPerfil(null);
      return;
    }
    try {
      const p = await buscarPerfil(u.id);
      setPerfil(p);
    } catch (err) {
      console.error('[auth] erro ao carregar perfil:', err);
      setPerfil(null);
    }
  }, []);

  const refreshPerfil = useCallback(async () => {
    await carregarPerfil(user);
  }, [user, carregarPerfil]);

  useEffect(() => {
    let ativo = true;

    // 1) Sessão inicial
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      const u = data.session?.user ?? null;
      setUser(u);
      await carregarPerfil(u);
      setLoading(false);
    });

    // 2) Escuta mudanças de sessão (login, logout, refresh token)
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!ativo) return;
        const u = session?.user ?? null;
        setUser(u);
        await carregarPerfil(u);
        setLoading(false);
      },
    );

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [carregarPerfil]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      perfil,
      loading,
      isAuthenticated: !!user,
      refreshPerfil,
    }),
    [user, perfil, loading, refreshPerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}