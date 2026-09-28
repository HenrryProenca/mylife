import type { CategoriaNatureza, CategoriaTipo } from './categorias.types';

export type TransacaoStatus = 'pendente' | 'concluida';

export type LancamentoTipo = 'receita' | 'fixo' | 'variavel' | 'cartao' | 'investimento';

export type FormaPagamento =
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'dinheiro'
  | 'transferencia'
  | 'outro';

export interface Transacao {
  id: string;
  household_id: string;
  tipo: CategoriaTipo;
  valor: number;
  data: string;
  descricao: string;
  observacao: string | null;
  categoria_id: string | null;
  conta_id: string | null;
  responsavel_id: string | null;
  forma_pagamento: FormaPagamento | null;
  status: TransacaoStatus;
  parcela_atual: number | null;
  parcela_total: number | null;
  tipo_no_cartao: 'avista' | 'parcelado' | null;
  categoria?: { nome: string; natureza: CategoriaNatureza; cor: string | null } | null;
  conta?: { nome: string; instituicao: string | null } | null;
  responsavel?: { nome: string } | null;
}

export interface TransacaoFormValues {
  tipo: LancamentoTipo;
  valor: number;
  data: string;
  descricao: string;
  observacao: string;
  categoria_id: string;
  conta_id: string;
  responsavel_id: string;
  forma_pagamento: FormaPagamento;
  status: TransacaoStatus;
  parcela_atual: number | null;
  parcela_total: number | null;
}

export interface TransacaoInsertInput extends TransacaoFormValues {
  household_id: string;
  created_by: string;
}

export const formaPagamentoLabels: Record<FormaPagamento, string> = {
  pix: 'Pix',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
  outro: 'Outro',
};
