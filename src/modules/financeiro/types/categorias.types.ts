export type CategoriaTipo = 'receita' | 'despesa';

export type CategoriaNatureza = 'fixo' | 'variavel' | 'investimento' | 'outro';

export interface Categoria {
  id: string;
  household_id: string;
  nome: string;
  tipo: CategoriaTipo;
  natureza: CategoriaNatureza;
  cor: string | null;
  icone: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInsertInput {
  household_id: string;
  nome: string;
  tipo: CategoriaTipo;
  natureza: CategoriaNatureza;
  cor?: string | null;
  icone?: string | null;
  ativa?: boolean;
}

export interface CategoriaUpdateInput {
  nome?: string;
  tipo?: CategoriaTipo;
  natureza?: CategoriaNatureza;
  cor?: string | null;
  icone?: string | null;
  ativa?: boolean;
}

export interface CategoriaFormValues {
  nome: string;
  tipo: CategoriaTipo;
  natureza: CategoriaNatureza;
  cor: string;
  icone: string;
  ativa: boolean;
}

export const categoriaTipos: CategoriaTipo[] = ['receita', 'despesa'];

export const categoriaNaturezas: CategoriaNatureza[] = [
  'fixo',
  'variavel',
  'investimento',
  'outro',
];

export const categoriaNaturezaLabels: Record<CategoriaNatureza, string> = {
  fixo: 'Fixo',
  variavel: 'Variável',
  investimento: 'Investimento',
  outro: 'Outro',
};

export const categoriaTipoLabels: Record<CategoriaTipo, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
};
