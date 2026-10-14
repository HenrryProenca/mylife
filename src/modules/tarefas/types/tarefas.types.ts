export type FrequenciaTarefa = 'diaria' | 'semanal' | 'mensal' | 'anual';

export interface Tarefa {
  id: string;
  household_id: string;
  titulo: string;
  descricao: string | null;
  frequencia: FrequenciaTarefa;
  dia_semana: number | null;
  dia_mes: number | null;
  mes: number | null;
  ativa: boolean;
  created_at: string;
}

export interface TarefaConclusao {
  id: string;
  household_id: string;
  tarefa_id: string;
  data_referencia: string;
  concluida_em: string;
}

export interface TarefaInput {
  titulo: string;
  descricao: string;
  frequencia: FrequenciaTarefa;
  dia_semana: number | null;
  dia_mes: number | null;
  mes: number | null;
}
