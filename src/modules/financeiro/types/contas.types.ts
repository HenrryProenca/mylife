export type ContaTipo = 'conta_corrente' | 'poupanca' | 'carteira' | 'investimento' | 'outro';

export interface Conta {
  id: string;
  household_id: string;
  nome: string;
  tipo: ContaTipo;
  instituicao: string | null;
  ativa: boolean;
}