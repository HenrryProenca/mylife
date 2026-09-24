import type { CategoriaInsertInput, CategoriaTipo } from '../types/categorias.types';

const seedReceitas: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Salário', natureza: 'outro' },
  { nome: 'Vale Refeição (VR)', natureza: 'outro' },
  { nome: 'Freelance', natureza: 'outro' },
  { nome: 'Outros', natureza: 'outro' },
];

const seedDespesasFixas: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Condomínio', natureza: 'fixo' },
  { nome: 'Internet', natureza: 'fixo' },
  { nome: 'Luz', natureza: 'fixo' },
  { nome: 'Água', natureza: 'fixo' },
  { nome: 'Financiamento', natureza: 'fixo' },
  { nome: 'Seguro', natureza: 'fixo' },
  { nome: 'Outros', natureza: 'fixo' },
];

const seedDespesasVariaveis: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Alimentação', natureza: 'variavel' },
  { nome: 'Transporte', natureza: 'variavel' },
  { nome: 'Supermercado', natureza: 'variavel' },
  { nome: 'Restaurantes', natureza: 'variavel' },
  { nome: 'Saúde', natureza: 'variavel' },
  { nome: 'Farmácia', natureza: 'variavel' },
  { nome: 'Compras', natureza: 'variavel' },
  { nome: 'Lazer', natureza: 'variavel' },
  { nome: 'Casa', natureza: 'variavel' },
  { nome: 'Estudo', natureza: 'variavel' },
  { nome: 'Outros', natureza: 'variavel' },
];

const seedDespesasInvestimento: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Tesouro Direto', natureza: 'investimento' },
  { nome: 'CDB', natureza: 'investimento' },
  { nome: 'Ações', natureza: 'investimento' },
  { nome: 'FII', natureza: 'investimento' },
  { nome: 'Cripto', natureza: 'investimento' },
  { nome: 'Reserva de Emergência', natureza: 'investimento' },
];

export const categoriasPadrao: Array<Omit<CategoriaInsertInput, 'household_id'>> = [
  ...seedReceitas.map((categoria) => ({ ...categoria, tipo: 'receita' as const })),
  ...seedDespesasFixas.map((categoria) => ({ ...categoria, tipo: 'despesa' as const })),
  ...seedDespesasVariaveis.map((categoria) => ({ ...categoria, tipo: 'despesa' as const })),
  ...seedDespesasInvestimento.map((categoria) => ({ ...categoria, tipo: 'despesa' as const })),
];

export function buildSeedCategorias(householdId: string): Array<CategoriaInsertInput> {
  return categoriasPadrao.map((categoria) => ({
    household_id: householdId,
    nome: categoria.nome,
    tipo: categoria.tipo as CategoriaTipo,
    natureza: categoria.natureza,
    cor: null,
    icone: null,
    ativa: true,
  }));
}
