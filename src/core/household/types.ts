export type HouseholdRole = 'owner' | 'admin' | 'membro' | 'visualizador';

export interface Household {
  id: string;
  nome: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  papel: HouseholdRole;
  created_at: string;
  updated_at: string;
}

export interface HouseholdWithMembership extends Household {
  membership: HouseholdMember;
}

export interface HouseholdState {
  households: HouseholdWithMembership[];
  activeHouseholdId: string | null;
  activeHousehold: HouseholdWithMembership | null;
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  hasHousehold: boolean;
}

export interface CreateHouseholdInput {
  nome: string;
}

export interface HouseholdContextValue {
  households: HouseholdWithMembership[];
  activeHouseholdId: string | null;
  activeHousehold: HouseholdWithMembership | null;
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  hasHousehold: boolean;
  setActiveHousehold: (householdId: string | null) => void;
  refreshHouseholds: () => Promise<void>;
  createHousehold: (input: CreateHouseholdInput) => Promise<HouseholdWithMembership>;
  deleteHousehold: (householdId: string) => Promise<void>;
}
