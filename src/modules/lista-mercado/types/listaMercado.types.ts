export type ListaMercadoStatus = 'pendente' | 'comprado';
export type CompraStatus = 'em_andamento' | 'concluida';

export interface ListaMercadoItem {
  id: string;
  household_id: string;
  nome: string;
  quantidade: string | null;
  observacao: string | null;
  status: ListaMercadoStatus;
  unidade: string;
  preco_referencia: number | null;
  preco_real?: number | null;
  template_id?: string | null;
  data_compra?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListaMercadoItemInput {
  nome: string;
  quantidade: string;
  observacao: string;
  unidade: string;
  preco_referencia: string;
  preco_real?: string;
}

export interface Compra {
  id: string;
  household_id: string;
  data_compra: string;
  status: CompraStatus;
  created_at: string;
  updated_at: string;
  itens?: CompraItem[];
}

export interface CompraItem {
  id: string;
  household_id: string;
  compra_id: string;
  item_base_id: string | null;
  nome: string;
  quantidade: number;
  unidade: string;
  preco_estimado: number | null;
  preco_real: number | null;
  comprado: boolean;
  created_at: string;
}

export interface CompraItemInput {
  itemBaseId: string | null;
  nome: string;
  quantidade: number;
  unidade: string;
  precoEstimado: number | null;
}

export interface ListaFixa {
  id: string;
  household_id: string;
  nome: string;
  created_at: string;
  itens?: ListaFixaItem[];
}

export interface ListaFixaItem {
  id: string;
  lista_id: string;
  nome: string;
  quantidade: string | null;
  observacao: string | null;
  unidade: string;
  preco_referencia: number | null;
}
