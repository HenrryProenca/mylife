export interface Responsavel {
  id: string;
  household_id: string;
  nome: string;
  user_id: string | null;
  ativo: boolean;
}

export interface ResponsavelInsertInput {
  household_id: string;
  nome: string;
  user_id?: string | null;
  ativo?: boolean;
}

export interface ResponsavelUpdateInput {
  nome?: string;
  user_id?: string | null;
  ativo?: boolean;
}

export interface ResponsavelFormValues {
  nome: string;
  user_id: string;
  ativo: boolean;
}
