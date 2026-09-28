import type { ResponsavelInsertInput } from '../types/responsaveis.types';

const responsaveisPadrao: Array<Pick<ResponsavelInsertInput, 'nome'>> = [
  { nome: 'Wesley' },
  { nome: 'Gabriella' },
  { nome: 'Casal' },
  { nome: 'Filho' },
  { nome: 'Outros' },
];

export function buildSeedResponsaveis(householdId: string): ResponsavelInsertInput[] {
  return responsaveisPadrao.map((r) => ({
    household_id: householdId,
    nome: r.nome,
    user_id: null,
    ativo: true,
  }));
}
