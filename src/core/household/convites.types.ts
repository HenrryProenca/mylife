export type ConviteStatus = 'pendente' | 'aceito' | 'cancelado';
export type ConvitePapel = 'admin' | 'membro';

export interface Convite {
  id: string;
  household_id: string;
  email_convidado: string;
  convidado_por: string;
  papel: ConvitePapel;
  status: ConviteStatus;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface CriarConviteInput {
  email_convidado: string;
  papel: ConvitePapel;
}

export interface AceitarConviteResultado {
  household_id: string;
  membership_id: string;
  papel: ConvitePapel;
}
