import type { CategoriaInsertInput, CategoriaTipo } from '../types/categorias.types';

const seedReceitas: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Salário', natureza: 'outro' },
  { nome: 'Pensão', natureza: 'outro' },
  { nome: 'Restituição', natureza: 'outro' },
  { nome: 'Caixinha', natureza: 'outro' },
  { nome: 'Reembolso', natureza: 'outro' },
  { nome: 'Carro', natureza: 'outro' },
  { nome: 'Cartão Itau', natureza: 'outro' },
  { nome: 'Férias', natureza: 'outro' },
  { nome: 'Vale Refeição (VR)', natureza: 'outro' },
  { nome: 'Vale Transporte (VT)', natureza: 'outro' },
  { nome: 'Vale Alimentação (VA)', natureza: 'outro' },
  { nome: 'Freelance', natureza: 'outro' },
  { nome: 'Bonificação', natureza: 'outro' },
  { nome: '13º Salário', natureza: 'outro' },
  { nome: 'Aluguel Recebido', natureza: 'outro' },
  { nome: 'Outros', natureza: 'outro' },
];

const seedDespesasFixas: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Apartamento', natureza: 'fixo' },
  { nome: 'Aluguel', natureza: 'fixo' },
  { nome: 'Condomínio', natureza: 'fixo' },
  { nome: 'Telefone/Celular', natureza: 'fixo' },
  { nome: 'Internet', natureza: 'fixo' },
  { nome: 'Luz', natureza: 'fixo' },
  { nome: 'Água', natureza: 'fixo' },
  { nome: 'IPTU', natureza: 'fixo' },
  { nome: 'Financiamento', natureza: 'fixo' },
  { nome: 'Seguro', natureza: 'fixo' },
  { nome: 'Escola/Faculdade', natureza: 'fixo' },
  { nome: 'Educação', natureza: 'fixo' },
  { nome: 'Plano de Saúde', natureza: 'fixo' },
  { nome: 'Assinaturas', natureza: 'fixo' },
  { nome: 'Academia', natureza: 'fixo' },
  { nome: 'Empréstimo', natureza: 'fixo' },
  { nome: 'Outros', natureza: 'fixo' },
];

const seedDespesasVariaveis: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Alimentação', natureza: 'variavel' },
  { nome: 'Bebida', natureza: 'variavel' },
  { nome: 'Barretos', natureza: 'variavel' },
  { nome: 'Combustível', natureza: 'variavel' },
  { nome: 'Transporte', natureza: 'variavel' },
  { nome: 'Pedágio', natureza: 'variavel' },
  { nome: 'Transporte (App)', natureza: 'variavel' },
  { nome: 'Supermercado', natureza: 'variavel' },
  { nome: 'Restaurantes', natureza: 'variavel' },
  { nome: 'Viagem', natureza: 'variavel' },
  { nome: 'Roupas', natureza: 'variavel' },
  { nome: 'Presentes', natureza: 'variavel' },
  { nome: 'Saúde', natureza: 'variavel' },
  { nome: 'Farmácia', natureza: 'variavel' },
  { nome: 'Compras', natureza: 'variavel' },
  { nome: 'Compras Online', natureza: 'variavel' },
  { nome: 'Eletrônicos', natureza: 'variavel' },
  { nome: 'Assinatura', natureza: 'variavel' },
  { nome: 'Fatura Cartão', natureza: 'variavel' },
  { nome: 'Pagamento Fatura', natureza: 'variavel' },
  { nome: 'Parcelamentos', natureza: 'variavel' },
  { nome: 'Perfume', natureza: 'variavel' },
  { nome: 'Vestuário', natureza: 'variavel' },
  { nome: 'Gastos', natureza: 'variavel' },
  { nome: 'Carregador', natureza: 'variavel' },
  { nome: 'Lazer', natureza: 'variavel' },
  { nome: 'Pet', natureza: 'variavel' },
  { nome: 'Manutenção', natureza: 'variavel' },
  { nome: 'Casa', natureza: 'variavel' },
  { nome: 'Estudo', natureza: 'variavel' },
  { nome: 'Urgência', natureza: 'variavel' },
  { nome: 'Outros', natureza: 'variavel' },
];

const seedDespesasInvestimento: Array<Omit<CategoriaInsertInput, 'household_id' | 'tipo'>> = [
  { nome: 'Tesouro Direto', natureza: 'investimento' },
  { nome: 'CDB', natureza: 'investimento' },
  { nome: 'Ações', natureza: 'investimento' },
  { nome: 'FII', natureza: 'investimento' },
  { nome: 'ETF', natureza: 'investimento' },
  { nome: 'Cripto', natureza: 'investimento' },
  { nome: 'Poupança', natureza: 'investimento' },
  { nome: 'Previdência Privada', natureza: 'investimento' },
  { nome: 'Reserva de Emergência', natureza: 'investimento' },
  { nome: 'Outros', natureza: 'investimento' },
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
