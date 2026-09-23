import { createContext, type ReactNode } from 'react';

export interface HouseholdContextValue {
  // ...
}

export const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  return (
    <HouseholdContext.Provider value={null}>{children}</HouseholdContext.Provider>
  );
}