import { useContext } from 'react';
import { HouseholdContext } from './HouseholdProvider';
import type { HouseholdContextValue } from './types';

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);

  if (!ctx) {
    throw new Error('useHousehold deve ser usado dentro de <HouseholdProvider>');
  }

  return ctx;
}