import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/core/auth/useAuth';
import {
  createHousehold,
  deleteHousehold as deleteHouseholdService,
  getStoredActiveHouseholdId,
  listarHouseholdsDoUsuario,
  setStoredActiveHouseholdId,
} from './household.service';
import type {
  CreateHouseholdInput,
  HouseholdContextValue,
  HouseholdWithMembership,
} from './types';

export const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [households, setHouseholds] = useState<HouseholdWithMembership[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeHousehold = useMemo(
    () => households.find((household) => household.id === activeHouseholdId) ?? null,
    [households, activeHouseholdId],
  );

  const aplicarHouseholds = useCallback((householdList: HouseholdWithMembership[]) => {
    setHouseholds(householdList);

    // Sempre escolhe um household ativo:
    // 1. Se o salvo ainda existe na lista, mantém.
    // 2. Senão, usa o primeiro da lista.
    // 3. Só fica null se a lista estiver vazia (não deveria acontecer com o pessoal).
    const storedActiveId = getStoredActiveHouseholdId();
    const nextActiveId =
      storedActiveId && householdList.some((household) => household.id === storedActiveId)
        ? storedActiveId
        : householdList[0]?.id ?? null;

    setActiveHouseholdId(nextActiveId);
    setStoredActiveHouseholdId(nextActiveId);
  }, []);

  const refreshHouseholds = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      setStoredActiveHouseholdId(null);
      return;
    }

    setLoading(true);

    try {
      let householdList = await listarHouseholdsDoUsuario(user.id);

      if (householdList.length === 0) {
        const nomePerfil = user.user_metadata?.nome;
        const primeiroNome =
          typeof nomePerfil === 'string'
            ? nomePerfil.trim().split(/\s+/)[0]
            : user.email?.split('@')[0] ?? 'Meu espaço';
        const espacoPessoal = await createHousehold(user.id, {
          nome: `${primeiroNome || 'Meu espaço'} (pessoal)`,
        });
        householdList = [espacoPessoal];
      }

      aplicarHouseholds(householdList);
    } catch (error) {
      console.error('[household] erro ao carregar households:', error);
      setHouseholds([]);
      setActiveHouseholdId(null);
      setStoredActiveHouseholdId(null);
    } finally {
      setLoading(false);
    }
  }, [aplicarHouseholds, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      setStoredActiveHouseholdId(null);
      setLoading(false);
      return;
    }

    void refreshHouseholds();
  }, [authLoading, isAuthenticated, user, refreshHouseholds]);

  const setActiveHousehold = useCallback((householdId: string | null) => {
    setActiveHouseholdId(householdId);
    setStoredActiveHouseholdId(householdId);
  }, []);

  const createHouseholdAction = useCallback(
    async (input: CreateHouseholdInput) => {
      if (!user) {
        throw new Error('É necessário estar autenticado para criar uma família.');
      }

      setCreating(true);

      try {
        const household = await createHousehold(user.id, input);

        setHouseholds((previousHouseholds) => {
          const alreadyExists = previousHouseholds.some(
            (item) => item.id === household.id,
          );

          if (alreadyExists) {
            return previousHouseholds.map((item) =>
              item.id === household.id ? household : item,
            );
          }

          return [...previousHouseholds, household];
        });

        setActiveHouseholdId(household.id);
        setStoredActiveHouseholdId(household.id);

        return household;
      } finally {
        setCreating(false);
      }
    },
    [user],
  );

  const deleteHouseholdAction = useCallback(
    async (householdId: string) => {
      if (!user) {
        throw new Error('É necessário estar autenticado para excluir uma família.');
      }

      setDeleting(true);

      try {
        await deleteHouseholdService(user.id, householdId);
        const householdList = await listarHouseholdsDoUsuario(user.id);
        aplicarHouseholds(householdList);
      } finally {
        setDeleting(false);
      }
    },
    [aplicarHouseholds, user],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      households,
      activeHouseholdId,
      activeHousehold,
      loading: authLoading || loading,
      creating,
      deleting,
      hasHousehold: households.length > 0,
      setActiveHousehold,
      refreshHouseholds,
      createHousehold: createHouseholdAction,
      deleteHousehold: deleteHouseholdAction,
    }),
    [
      households,
      activeHouseholdId,
      activeHousehold,
      authLoading,
      loading,
      creating,
      deleting,
      setActiveHousehold,
      refreshHouseholds,
      createHouseholdAction,
      deleteHouseholdAction,
    ],
  );

  return (
    <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
  );
}
