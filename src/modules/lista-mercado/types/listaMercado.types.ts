export type ListaMercadoStatus = 'pendente' | 'comprado';

export interface ListaMercadoItem {
  id: string;
  household_id: string;
  nome: string;
  quantidade: string | null;
  observacao: string | null;
  status: ListaMercadoStatus;
  created_at: string;
  updated_at: string;
}

export interface ListaMercadoItemInput {
  nome: string;
  quantidade: string;
  observacao: string;
}
