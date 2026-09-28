#!/usr/bin/env bash

# ============================================================
# Bloco F — Campo "responsável" no formulário de lançamento
# ============================================================
# O que este script faz:
# - Adiciona responsável como conceito de primeira classe no financeiro
# - Seed de responsáveis (Wesley, Gabriella, Casal, Filho, Outros)
# - Campo "Responsável" no LancamentoForm (linha separada, opcional)
# - Coluna de responsável na tabela do DashboardPage
# - Persistência de responsavel_id em transacoes
#
# Arquivos criados:
#   - src/modules/financeiro/types/responsaveis.types.ts
#   - src/modules/financeiro/utils/seedResponsaveis.ts
#   - src/modules/financeiro/services/responsaveis.service.ts
#   - src/modules/financeiro/hooks/useResponsaveis.ts
#
# Arquivos alterados:
#   - src/modules/financeiro/types/transacoes.types.ts (sobrescrito)
#   - src/modules/financeiro/services/transacoes.service.ts (sobrescrito)
#   - src/modules/financeiro/components/LancamentoForm.tsx (sobrescrito)
#   - src/modules/financeiro/pages/DashboardPage.tsx (sobrescrito)
#   - src/core/household/household.service.ts (sobrescrito)
# ============================================================

set -e

# ---------- CRIAR: types/responsaveis.types.ts ----------
cat << 'EOF' > src/modules/financeiro/types/responsaveis.types.ts
export interface Responsavel {
  id: string;
  household_id: string;
  nome: string;
  user_id: string | null;
  ativo: boolean;
}

export interface ResponsavelInsertInput {
  household_id: string;
  nome: string;
  user_id?: string | null;
  ativo?: boolean;
}
EOF

# ---------- CRIAR: utils/seedResponsaveis.ts ----------
cat << 'EOF' > src/modules/financeiro/utils/seedResponsaveis.ts
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
EOF

# ---------- CRIAR: services/responsaveis.service.ts ----------
cat << 'EOF' > src/modules/financeiro/services/responsaveis.service.ts
import { supabase } from '@/lib/supabase';
import type { Responsavel } from '../types/responsaveis.types';
import { buildSeedResponsaveis } from '../utils/seedResponsaveis';

export async function listarResponsaveisAtivos(householdId: string): Promise<Responsavel[]> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('id, household_id, nome, user_id, ativo')
    .eq('household_id', householdId)
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Responsavel[];
}

export async function garantirResponsaveisPadrao(householdId: string): Promise<void> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('nome')
    .eq('household_id', householdId);

  if (error) throw error;

  const existing = new Set((data ?? []).map((r) => r.nome));
  const missing = buildSeedResponsaveis(householdId).filter((r) => !existing.has(r.nome));

  if (missing.length === 0) return;

  const { error: insertError } = await supabase.from('responsaveis').insert(missing);
  if (insertError) throw insertError;
}
EOF

# ---------- CRIAR: hooks/useResponsaveis.ts ----------
cat << 'EOF' > src/modules/financeiro/hooks/useResponsaveis.ts
import { useQuery } from '@tanstack/react-query';
import { useHousehold } from '@/core/household/useHousehold';
import { garantirResponsaveisPadrao, listarResponsaveisAtivos } from '../services/responsaveis.service';

export const responsaveisQueryKey = ['responsaveis'];

export function useResponsaveis() {
  const { activeHousehold } = useHousehold();
  const householdId = activeHousehold?.id ?? null;

  const query = useQuery({
    queryKey: [...responsaveisQueryKey, householdId],
    enabled: Boolean(householdId),
    queryFn: async () => {
      if (!householdId) return [];
      await garantirResponsaveisPadrao(householdId);
      return listarResponsaveisAtivos(householdId);
    },
  });

  return { responsaveis: query.data ?? [], isLoading: query.isLoading };
}
EOF

# ---------- ALTERAR: types/transacoes.types.ts ----------
cat << 'EOF' > src/modules/financeiro/types/transacoes.types.ts
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
EOF

# ---------- ALTERAR: services/transacoes.service.ts ----------
cat << 'EOF' > src/modules/financeiro/services/transacoes.service.ts
import { addMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type {
  LancamentoTipo,
  Transacao,
  TransacaoFormValues,
  TransacaoInsertInput,
} from '../types/transacoes.types';

export async function listarTransacoes(
  householdId: string,
  inicio?: string,
  fim?: string,
): Promise<Transacao[]> {
  let query = supabase
    .from('transacoes')
    .select('*, categoria:categorias(nome, natureza, cor), conta:contas(nome, instituicao), responsavel:responsaveis(nome)')
    .eq('household_id', householdId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });

  if (inicio) query = query.gte('data', inicio);
  if (fim) query = query.lte('data', fim);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Transacao[];
}

function databaseType(tipo: LancamentoTipo) {
  return tipo === 'receita' ? 'receita' : 'despesa';
}

function isParcelado(values: TransacaoFormValues) {
  return values.tipo === 'cartao' && (values.parcela_total ?? 0) > 1;
}

function transactionPayload(
  householdId: string,
  userId: string,
  values: TransacaoFormValues,
  data: string,
  parcelamentoId: string | null,
  parcelaAtual: number | null,
  parcelaTotal: number | null,
) {
  return {
    household_id: householdId,
    tipo: databaseType(values.tipo),
    valor: values.valor,
    data,
    descricao: values.descricao.trim() || 'Sem descrição',
    observacao: values.observacao.trim() || null,
    categoria_id: values.categoria_id || null,
    conta_id: values.conta_id || null,
    responsavel_id: values.responsavel_id || null,
    forma_pagamento: values.forma_pagamento,
    tipo_no_cartao: values.tipo === 'cartao'
      ? (isParcelado(values) ? 'parcelado' : 'avista')
      : null,
    parcelamento_id: parcelamentoId,
    parcela_atual: parcelaAtual,
    parcela_total: parcelaTotal,
    status: values.status,
    created_by: userId,
  };
}

export async function criarTransacao(input: TransacaoInsertInput): Promise<Transacao> {
  const { household_id: householdId, created_by: userId } = input;

  // --- Lançamento simples (não parcelado) ---
  if (!isParcelado(input)) {
    const { data, error } = await supabase
      .from('transacoes')
      .insert(transactionPayload(householdId, userId, input, input.data, null, null, null))
      .select('*, categoria:categorias(nome, natureza, cor), conta:contas(nome, instituicao), responsavel:responsaveis(nome)')
      .single();

    if (error) throw error;
    return data as Transacao;
  }

  // --- Lançamento parcelado ---
  const total = input.parcela_total as number;
  const valorParcela = input.valor / total;

  const { data: parcelamento, error: parcelamentoError } = await supabase
    .from('parcelamentos')
    .insert({
      household_id: householdId,
      descricao: input.descricao.trim() || 'Compra parcelada',
      valor_total: input.valor,
      valor_parcela: valorParcela,
      total_parcelas: total,
      data_primeira_parcela: input.data,
      categoria_id: input.categoria_id || null,
      conta_id: input.conta_id || null,
      responsavel_id: input.responsavel_id || null,
      forma_pagamento: input.forma_pagamento,
      observacao: input.observacao.trim() || null,
      created_by: userId,
    })
    .select('id')
    .single();

  if (parcelamentoError) throw parcelamentoError;

  const rows = Array.from({ length: total }, (_, index) =>
    transactionPayload(
      householdId,
      userId,
      { ...input, valor: valorParcela },
      addMonths(new Date(`${input.data}T12:00:00`), index).toISOString().slice(0, 10),
      parcelamento.id,
      index + 1,
      total,
    ),
  );

  const { data, error } = await supabase
    .from('transacoes')
    .insert(rows)
    .select('*, categoria:categorias(nome, natureza, cor), conta:contas(nome, instituicao), responsavel:responsaveis(nome)')
    .order('parcela_atual', { ascending: true });

  if (error) throw error;
  return (data?.[0] ?? rows[0]) as Transacao;
}

export async function atualizarTransacao(
  householdId: string,
  transacaoId: string,
  values: TransacaoFormValues,
): Promise<void> {
  const { error } = await supabase
    .from('transacoes')
    .update({
      tipo: databaseType(values.tipo),
      valor: values.valor,
      data: values.data,
      descricao: values.descricao.trim() || 'Sem descrição',
      observacao: values.observacao.trim() || null,
      categoria_id: values.categoria_id || null,
      conta_id: values.conta_id || null,
      responsavel_id: values.responsavel_id || null,
      forma_pagamento: values.forma_pagamento,
      status: values.status,
    })
    .eq('id', transacaoId)
    .eq('household_id', householdId);

  if (error) throw error;
}

export async function excluirTransacao(
  householdId: string,
  transacaoId: string,
): Promise<void> {
  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', transacaoId)
    .eq('household_id', householdId);

  if (error) throw error;
}

export async function atualizarStatusTransacao(
  householdId: string,
  transacaoId: string,
  status: Transacao['status'],
): Promise<void> {
  const { error } = await supabase
    .from('transacoes')
    .update({ status })
    .eq('id', transacaoId)
    .eq('household_id', householdId);

  if (error) throw error;
}
EOF

# ---------- ALTERAR: components/LancamentoForm.tsx ----------
cat << 'EOF' > src/modules/financeiro/components/LancamentoForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCategorias } from '../hooks/useCategorias';
import { useContas } from '../hooks/useContas';
import { useResponsaveis } from '../hooks/useResponsaveis';
import type { LancamentoTipo, TransacaoFormValues } from '../types/transacoes.types';

const schema = z.object({
  tipo: z.enum(['receita', 'fixo', 'variavel', 'cartao', 'investimento']),
  valor: z.coerce.number().positive('Informe um valor maior que zero.'),
  data: z.string().min(1, 'Informe a data.'),
  descricao: z.string(),
  observacao: z.string(),
  categoria_id: z.string(),
  conta_id: z.string(),
  responsavel_id: z.string(),
  forma_pagamento: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'transferencia', 'outro']),
  status: z.enum(['pendente', 'concluida']),
  parcela_atual: z.number().nullable(),
  parcela_total: z.number().nullable(),
});

const emptyValues: TransacaoFormValues = {
  tipo: 'receita', valor: 0, data: new Date().toISOString().slice(0, 10), descricao: '', observacao: '',
  categoria_id: '', conta_id: '', responsavel_id: '', forma_pagamento: 'transferencia', status: 'concluida', parcela_atual: null, parcela_total: null,
};

interface LancamentoFormProps {
  initialValues?: Partial<TransacaoFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: TransacaoFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const tipoLabels: Record<LancamentoTipo, string> = {
  receita: 'Receita', fixo: 'Gasto fixo', variavel: 'Gasto variável', cartao: 'Cartão de crédito', investimento: 'Investimento',
};

export function LancamentoForm({ initialValues, isSubmitting = false, onSubmit, onCancel }: LancamentoFormProps) {
  const { categorias } = useCategorias();
  const { contas } = useContas();
  const { responsaveis } = useResponsaveis();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<TransacaoFormValues>({ defaultValues: { ...emptyValues, ...initialValues } });
  const tipo = watch('tipo');
  const categoriaId = watch('categoria_id');
  const parcelaTotal = watch('parcela_total');
  const categoriaTipo = tipo === 'receita' ? 'receita' : 'despesa';
  const natureza = tipo === 'fixo' ? 'fixo' : tipo === 'investimento' ? 'investimento' : tipo === 'variavel' || tipo === 'cartao' ? 'variavel' : null;
  const categoriasDoTipo = categorias.filter((categoria) => categoria.tipo === categoriaTipo && categoria.ativa && (!natureza || categoria.natureza === natureza));

  useEffect(() => {
    reset({ ...emptyValues, ...initialValues });
  }, [initialValues, reset]);

  useEffect(() => {
    if (!categoriasDoTipo.some((categoria) => categoria.id === categoriaId)) {
      const categoria = categoriasDoTipo[0];
      if (categoria) reset({ ...watch(), categoria_id: categoria.id });
    }
  }, [categoriasDoTipo, categoriaId, reset, watch]);

  const submit = async (values: TransacaoFormValues) => {
    const parsed = schema.safeParse({
      ...values,
      parcela_atual: values.tipo === 'cartao' && values.parcela_total ? values.parcela_atual ?? 1 : null,
      parcela_total: values.tipo === 'cartao' && values.parcela_total ? values.parcela_total : null,
    });
    if (parsed.success) await onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[130px_140px_1.1fr_1fr_1fr_1.1fr_110px_auto]">
        <Field label="Data"><input type="date" {...register('data')} className="input-base" /></Field>
        <Field label="Tipo"><select {...register('tipo')} className="input-base">{Object.entries(tipoLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Categoria"><select {...register('categoria_id')} className="input-base"><option value="">Sem categoria</option>{categoriasDoTipo.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></Field>
        <Field label="Forma de pagamento"><select {...register('forma_pagamento')} className="input-base"><option value="pix">Pix</option><option value="cartao_credito">Cartão de crédito</option><option value="cartao_debito">Cartão de débito</option><option value="boleto">Boleto</option><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="outro">Outro</option></select></Field>
        <Field label="Instituição"><select {...register('conta_id')} className="input-base"><option value="">Sem instituição</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.instituicao ? `${conta.instituicao} · ${conta.nome}` : conta.nome}</option>)}</select></Field>
        <Field label="Descrição"><input {...register('descricao')} className="input-base" placeholder="Ex: Aluguel de setembro" /></Field>
        <Field label="Valor (R$)"><input type="number" min="0" step="0.01" {...register('valor', { valueAsNumber: true })} className="input-base" placeholder="0,00" />{errors.valor ? <ErrorText>{errors.valor.message}</ErrorText> : null}</Field>
        <div className="flex items-end"><button type="submit" disabled={isSubmitting} className="btn-primary flex w-full items-center justify-center">{isSubmitting ? '...' : 'Lançar'}</button></div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Responsável">
          <select {...register('responsavel_id')} className="input-base">
            <option value="">Sem responsável</option>
            {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </Field>
      </div>

      {tipo === 'cartao' ? <div className="grid gap-3 sm:grid-cols-3"><Field label="Parcela atual"><input type="number" min="1" {...register('parcela_atual', { valueAsNumber: true })} className="input-base" placeholder="1" /></Field><Field label="Total de parcelas"><input type="number" min="2" {...register('parcela_total', { valueAsNumber: true })} className="input-base" placeholder="10" /></Field><Field label="Status"><select {...register('status')} className="input-base"><option value="concluida">Concluído</option><option value="pendente">Pendente</option></select></Field></div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-ink-500">{tipo === 'cartao' && parcelaTotal && parcelaTotal > 1 ? `Serão criadas ${parcelaTotal} parcelas mensais.` : 'Registre receitas, gastos, cartões ou investimentos.'}</p><div className="flex gap-3">{onCancel ? <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button> : null}<button type="button" className="btn-ghost" onClick={() => reset({ ...emptyValues, ...initialValues })}>Limpar</button></div></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="label-base">{label}</span>{children}</label>;
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  return <span className="mt-1 block text-xs text-state-error">{children}</span>;
}
EOF

# ---------- ALTERAR: pages/DashboardPage.tsx ----------
cat << 'EOF' > src/modules/financeiro/pages/DashboardPage.tsx
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, ChevronLeft, ChevronRight, Download, Home, Infinity, Layers, Pencil, PiggyBank, Plus, Scale, Search, Tag, Trash2, TrendingDown, TrendingUp, Upload, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useHousehold } from '@/core/household/useHousehold';
import { CategoriasManager } from '../components/CategoriasManager';
import { LancamentoForm } from '../components/LancamentoForm';
import { useTransacoes } from '../hooks/useTransacoes';
import { formaPagamentoLabels, type LancamentoTipo, type Transacao, type TransacaoFormValues } from '../types/transacoes.types';

const modes = ['dia', 'semana', 'quinzena', 'mes', 'ano', 'tudo'] as const;
type PeriodMode = typeof modes[number];

function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function dateInput(value: Date) { return format(value, 'yyyy-MM-dd'); }
function dateLabel(value: string) { return format(new Date(`${value}T12:00:00`), 'dd/MM/yyyy'); }
function transactionType(item: Transacao): LancamentoTipo {
  if (item.tipo === 'receita') return 'receita';
  if (item.tipo_no_cartao === 'parcelado' || item.tipo_no_cartao === 'avista' && item.forma_pagamento === 'cartao_credito') return 'cartao';
  return item.categoria?.natureza === 'fixo' ? 'fixo' : item.categoria?.natureza === 'investimento' ? 'investimento' : 'variavel';
}
function typeLabel(type: LancamentoTipo) { return { receita: 'Receita', fixo: 'Fixo', variavel: 'Variável', cartao: 'Cartão', investimento: 'Investimento' }[type]; }
function chartColor(type: LancamentoTipo) { return { receita: '#5A9F7E', fixo: '#5872C9', variavel: '#D9A85C', cartao: '#5872C9', investimento: '#BCC9EC' }[type]; }

function getRange(mode: PeriodMode, reference: Date) {
  if (mode === 'tudo') return { inicio: undefined, fim: undefined };
  if (mode === 'dia') return { inicio: dateInput(startOfDay(reference)), fim: dateInput(endOfDay(reference)) };
  if (mode === 'semana') return { inicio: dateInput(startOfWeek(reference, { weekStartsOn: 1 })), fim: dateInput(endOfWeek(reference, { weekStartsOn: 1 })) };
  if (mode === 'ano') return { inicio: dateInput(startOfYear(reference)), fim: dateInput(endOfYear(reference)) };
  if (mode === 'quinzena') {
    const start = reference.getDate() > 15 ? new Date(reference.getFullYear(), reference.getMonth(), 16) : startOfMonth(reference);
    const end = reference.getDate() > 15 ? endOfMonth(reference) : new Date(reference.getFullYear(), reference.getMonth(), 15);
    return { inicio: dateInput(start), fim: dateInput(end) };
  }
  return { inicio: dateInput(startOfMonth(reference)), fim: dateInput(endOfMonth(reference)) };
}

function periodLabel(mode: PeriodMode, reference: Date) {
  if (mode === 'tudo') return 'Todo o histórico';
  if (mode === 'dia') return format(reference, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  if (mode === 'semana') { const range = getRange(mode, reference); return `${format(new Date(`${range.inicio}T12:00:00`), 'dd MMM', { locale: ptBR })} - ${format(new Date(`${range.fim}T12:00:00`), 'dd MMM yyyy', { locale: ptBR })}`; }
  if (mode === 'quinzena') return `${reference.getDate() > 15 ? '2ª' : '1ª'} quinzena · ${format(reference, 'MMM yyyy', { locale: ptBR })}`;
  return format(reference, mode === 'ano' ? 'yyyy' : 'MMM yyyy', { locale: ptBR });
}

export default function DashboardPage() {
  const { hasHousehold } = useHousehold();
  const [mode, setMode] = useState<PeriodMode>('mes');
  const [reference, setReference] = useState(new Date());
  const range = useMemo(() => getRange(mode, reference), [mode, reference]);
  const { transacoes, isLoading, isError, error, criarTransacao, atualizarTransacao, excluirTransacao, isCreating, isUpdating } = useTransacoes(range.inicio, range.fim);
  const [editing, setEditing] = useState<Transacao | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [onlyInstallments, setOnlyInstallments] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    const receitas = transacoes.filter((item) => item.tipo === 'receita').reduce((sum, item) => sum + Number(item.valor), 0);
    const gastos = transacoes.filter((item) => item.tipo === 'despesa' && transactionType(item) !== 'investimento').reduce((sum, item) => sum + Number(item.valor), 0);
    const fixos = transacoes.filter((item) => transactionType(item) === 'fixo').reduce((sum, item) => sum + Number(item.valor), 0);
    const investimentos = transacoes.filter((item) => transactionType(item) === 'investimento').reduce((sum, item) => sum + Number(item.valor), 0);
    const base = receitas;
    return { receitas, gastos, fixos, investimentos, balanco: receitas - gastos - investimentos, comprometida: base ? (gastos / base) * 100 : 0, base };
  }, [transacoes]);

  const categories = useMemo(() => [...new Set(transacoes.map((item) => item.categoria?.nome).filter((value): value is string => Boolean(value)))].sort(), [transacoes]);
  const accounts = useMemo(() => [...new Set(transacoes.map((item) => item.conta?.instituicao ?? item.conta?.nome).filter((value): value is string => Boolean(value)))].sort(), [transacoes]);
  const filtered = useMemo(() => transacoes.filter((item) => {
    const type = transactionType(item);
    const text = `${item.descricao} ${item.categoria?.nome ?? ''} ${item.conta?.instituicao ?? ''} ${item.responsavel?.nome ?? ''}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!filterType || type === filterType) && (!filterCategory || item.categoria?.nome === filterCategory) && (!filterAccount || (item.conta?.instituicao ?? item.conta?.nome) === filterAccount) && (!onlyInstallments || Boolean(item.parcela_total));
  }), [filterAccount, filterCategory, filterType, onlyInstallments, search, transacoes]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, { label: string; receita: number; gastos: number; investimento: number }>();
    transacoes.forEach((item) => {
      const date = new Date(`${item.data}T12:00:00`);
      const key = mode === 'ano' || mode === 'tudo' ? format(date, 'yyyy-MM') : mode === 'mes' ? `S${Math.ceil(date.getDate() / 7)}` : item.data;
      const label = mode === 'ano' || mode === 'tudo' ? format(date, 'MMM/yy', { locale: ptBR }) : mode === 'mes' ? key : format(date, mode === 'dia' ? 'HH:mm' : 'dd/MM');
      const bucket = buckets.get(key) ?? { label, receita: 0, gastos: 0, investimento: 0 };
      const type = transactionType(item);
      if (item.tipo === 'receita') bucket.receita += Number(item.valor);
      else if (type === 'investimento') bucket.investimento += Number(item.valor);
      else bucket.gastos += Number(item.valor);
      buckets.set(key, bucket);
    });
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [mode, transacoes]);

  const categoryData = useMemo(() => aggregate(transacoes.filter((item) => item.tipo === 'despesa' && transactionType(item) !== 'investimento'), (item) => item.categoria?.nome ?? 'Sem categoria'), [transacoes]);
  const typeData = useMemo(() => aggregate(transacoes.filter((item) => item.tipo === 'despesa'), transactionType), [transacoes]);
  const paymentData = useMemo(() => aggregate(transacoes.filter((item) => item.tipo === 'despesa'), (item) => item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : 'Não informado'), [transacoes]);
  const accountData = useMemo(() => aggregate(transacoes.filter((item) => item.tipo === 'despesa'), (item) => item.conta?.instituicao ?? item.conta?.nome ?? 'Não informado'), [transacoes]);

  async function saveLaunch(values: TransacaoFormValues) {
    try {
      if (editing) { await atualizarTransacao({ id: editing.id, values }); setEditing(null); toast.success('Lançamento atualizado.'); }
      else { await criarTransacao(values); toast.success('Lançamento adicionado.'); }
    } catch (saveError) { toast.error(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o lançamento.'); }
  }
  async function deleteLaunch(item: Transacao) {
    if (!window.confirm(`Excluir o lançamento "${item.descricao}"?`)) return;
    try { await excluirTransacao(item.id); if (editing?.id === item.id) setEditing(null); toast.success('Lançamento excluído.'); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o lançamento.'); }
  }
  function movePeriod(direction: number) {
    if (mode === 'tudo') return;
    setReference((value) => mode === 'dia' ? addDays(value, direction) : mode === 'semana' ? addWeeks(value, direction) : mode === 'ano' ? addYears(value, direction) : addMonths(value, direction));
  }
  function exportCsv() {
    const rows = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Forma de pagamento', 'Instituição', 'Responsável', 'Parcela', 'Valor'], ...filtered.map((item) => [item.data, item.descricao, item.categoria?.nome ?? '', typeLabel(transactionType(item)), item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : '', item.conta?.instituicao ?? item.conta?.nome ?? '', item.responsavel?.nome ?? '', item.parcela_total ? `${item.parcela_atual}/${item.parcela_total}` : '', String(item.valor).replace('.', ',')])];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `mylife-${mode}-${dateInput(reference)}.csv`; anchor.click(); URL.revokeObjectURL(url); toast.success('CSV exportado.');
  }
  async function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const text = await file.text(); const defaultCategory = transacoes.find((item) => item.tipo === 'despesa' && item.categoria_id)?.categoria_id ?? '';
    const rows = text.split(/\r?\n/).slice(1).map((line) => line.split(/[;,]/)).filter((row) => row.length >= 3);
    let count = 0;
    for (const row of rows) {
      const value = Number(row[2]?.replace(/\./g, '').replace(',', '.')); if (!Number.isFinite(value) || value <= 0) continue;
      await criarTransacao({ tipo: 'variavel', data: row[0] ?? dateInput(new Date()), descricao: row[1] ?? 'Importado', valor: value, categoria_id: defaultCategory, conta_id: '', responsavel_id: '', forma_pagamento: 'pix', status: 'concluida', observacao: 'Importado via CSV', parcela_atual: null, parcela_total: null }); count += 1;
    }
    event.target.value = ''; toast.success(`${count} lançamento(s) importado(s).`);
  }

  if (!hasHousehold) return <EmptyState title="Selecione uma família" description="Escolha uma família para usar o controle financeiro." />;
  if (isError) return <EmptyState title="Não foi possível carregar o financeiro" description={error instanceof Error ? error.message : 'Tente novamente.'} />;

  return <div className="mx-auto max-w-[1400px] space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600 shadow-glow"><Wallet className="h-6 w-6" /></div><div><h1 className="font-display text-h2 font-semibold text-ink-900">Financeiro</h1><p className="text-xs text-ink-500">Resumo e controle financeiro</p></div></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setShowCategories(true)} className="btn-ghost flex items-center gap-2 text-sm"><Tag className="h-4 w-4" />Categorias</button><button type="button" onClick={() => importRef.current?.click()} className="btn-ghost flex items-center gap-2 text-sm"><Upload className="h-4 w-4" />Importar</button><button type="button" onClick={exportCsv} className="btn-ghost flex items-center gap-2 text-sm"><Download className="h-4 w-4" />Exportar</button><input ref={importRef} type="file" accept=".csv,.txt" onChange={importCsv} className="hidden" /></div></header>
    <section className="card flex flex-wrap items-center justify-between gap-4 p-3"><div className="flex flex-wrap gap-1 rounded-lg border border-canvas-300 bg-canvas-100 p-1">{modes.map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize transition ${mode === item ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-900'}`}>{item === 'tudo' ? <Infinity className="inline h-3.5 w-3.5" /> : item}</button>)}</div><div className="flex items-center gap-2"><button type="button" onClick={() => movePeriod(-1)} disabled={mode === 'tudo'} className="icon-button" aria-label="Período anterior"><ChevronLeft className="h-4 w-4" /></button><div className="min-w-48 rounded-lg border border-canvas-300 bg-canvas-100 px-4 py-2 text-center text-sm font-semibold text-ink-900">{periodLabel(mode, reference)}</div><button type="button" onClick={() => movePeriod(1)} disabled={mode === 'tudo'} className="icon-button" aria-label="Próximo período"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => setReference(new Date())} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">Hoje</button></div></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><Kpi label="Receitas" value={summary.receitas} sub={`${transacoes.filter((item) => item.tipo === 'receita').length} entradas`} icon={<TrendingUp />} tone="success" /><Kpi label="Gastos totais" value={summary.gastos} sub={`${transacoes.filter((item) => item.tipo === 'despesa' && transactionType(item) !== 'investimento').length} saídas`} icon={<TrendingDown />} tone="error" /><Kpi label="Balanço" value={summary.balanco} sub={summary.balanco >= 0 ? 'Você fechou no positivo' : 'Atenção ao resultado'} icon={<Scale />} tone={summary.balanco >= 0 ? 'success' : 'error'} /><Kpi label="Gastos fixos" value={summary.fixos} sub="Custos recorrentes" icon={<Home />} tone="info" /><Kpi label="Investimentos" value={summary.investimentos} sub="Aportes registrados" icon={<PiggyBank />} tone="success" /><div className="card p-4"><p className="kpi-label"><span>Renda comprometida</span></p><p className="mt-3 font-display text-xl font-semibold text-state-alert">{summary.base ? `${summary.comprometida.toFixed(1)}%` : '—'}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-200"><div className="h-full rounded-full bg-brand-300" style={{ width: `${Math.min(summary.comprometida, 100)}%` }} /></div><p className="mt-2 text-xs text-ink-500">{summary.base ? `${money(summary.gastos)} sobre ${money(summary.base)}` : 'Informe sua renda'}</p></div></section>
    <section className="card p-5"><div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-state-success" /><div><h2 className="font-display text-h3 text-ink-900">Novo lançamento</h2><p className="text-xs text-ink-500">Registre receitas, gastos fixos, variáveis, cartão ou investimentos.</p></div>{editing ? <span className="ml-2 rounded-full bg-state-alert/15 px-2 py-1 text-xs text-state-alert">Editando</span> : null}</div><LancamentoForm key={editing?.id ?? 'new'} initialValues={editing ? toFormValues(editing) : undefined} isSubmitting={isCreating || isUpdating} onSubmit={saveLaunch} onCancel={editing ? () => setEditing(null) : undefined} /></section>
    <section className="grid gap-4 lg:grid-cols-2"><ChartCard title="Entrou vs Saiu" icon={<BarChart3 />}><FinancialChart variant="flow" data={chartData} /></ChartCard><ChartCard title="Gastos por categoria" icon={<Tag />}><FinancialChart variant="category" data={categoryData} /></ChartCard><ChartCard title="Distribuição por tipo" icon={<Layers />}><FinancialChart variant="pie" data={typeData.map((item) => ({ ...item, label: typeLabel(item.label as LancamentoTipo) }))} /></ChartCard><ChartCard title="Gastos por forma de pagamento" icon={<Wallet />}><FinancialChart variant="horizontal" data={paymentData} /></ChartCard><ChartCard title="Gastos fixos por categoria" icon={<Home />}><FinancialChart variant="horizontal" data={aggregate(transacoes.filter((item) => transactionType(item) === 'fixo'), (item) => item.categoria?.nome ?? 'Sem categoria')} /></ChartCard><ChartCard title="Gastos por instituição" icon={<Wallet />}><FinancialChart variant="horizontal" data={accountData} /></ChartCard></section>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas-300 p-5"><div><h2 className="font-display text-h3 text-ink-900">Transações do período</h2><p className="mt-1 text-xs text-ink-500">{filtered.length} registro(s) · {periodLabel(mode, reference)}</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." className="input-base w-40 pl-8 text-xs" /></label><select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="input-base w-32 text-xs"><option value="">Todos os tipos</option>{(['receita', 'fixo', 'variavel', 'cartao', 'investimento'] as LancamentoTipo[]).map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}</select><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="input-base w-36 text-xs"><option value="">Categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={filterAccount} onChange={(event) => setFilterAccount(event.target.value)} className="input-base w-36 text-xs"><option value="">Instituições</option>{accounts.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => setOnlyInstallments((value) => !value)} className={`btn-ghost text-xs ${onlyInstallments ? 'border-brand-400 text-brand-600' : ''}`}><Layers className="h-3.5 w-3.5" />Parcelados</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="border-b border-canvas-300 text-xs uppercase tracking-wider text-ink-500"><tr><th className="px-5 py-3">Data</th><th className="px-3 py-3">Descrição</th><th className="px-3 py-3">Categoria</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Responsável</th><th className="px-3 py-3">Pagamento</th><th className="px-3 py-3 text-right">Valor</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-canvas-300">{filtered.map((item) => <TransactionRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => deleteLaunch(item)} />)}</tbody></table>{isLoading ? <div className="p-8 text-center text-sm text-ink-500">Carregando...</div> : !filtered.length ? <div className="p-8"><EmptyState title="Nenhuma transação encontrada" description="Ajuste os filtros ou crie um novo lançamento." /></div> : null}</div></section>
    <Modal open={showCategories} title="Categorias" description="Gerencie as categorias do Financeiro sem sair do dashboard." onClose={() => setShowCategories(false)} maxWidth="max-w-2xl"><CategoriasManager /></Modal>
  </div>;
}

function toFormValues(item: Transacao): TransacaoFormValues { return { tipo: transactionType(item), valor: Number(item.valor), data: item.data, descricao: item.descricao, observacao: item.observacao ?? '', categoria_id: item.categoria_id ?? '', conta_id: item.conta_id ?? '', responsavel_id: item.responsavel_id ?? '', forma_pagamento: item.forma_pagamento ?? 'pix', status: item.status, parcela_atual: item.parcela_atual, parcela_total: item.parcela_total }; }
function aggregate(items: Transacao[], getLabel: (item: Transacao) => string) { const values = new Map<string, number>(); items.forEach((item) => values.set(getLabel(item), (values.get(getLabel(item)) ?? 0) + Number(item.valor))); return [...values.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8); }

function Kpi({ label, value, sub, icon, tone }: { label: string; value: number; sub: string; icon: ReactNode; tone: string }) { return <div className="card p-4"><div className="flex items-center justify-between"><p className="kpi-label">{label}</p><span className={`rounded-lg p-2 ${tone === 'error' ? 'bg-state-error/10 text-state-error' : tone === 'info' ? 'bg-state-info/10 text-state-info' : 'bg-state-success/10 text-state-success'}`}>{icon}</span></div><p className={`mt-3 font-display text-xl font-semibold ${tone === 'error' ? 'text-state-error' : tone === 'info' ? 'text-state-info' : 'text-state-success'}`}>{money(value)}</p><p className="mt-1 text-xs text-ink-500">{sub}</p></div>; }
function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) { return <div className="card p-5"><div className="mb-4 flex items-center gap-2"><span className="text-brand-600">{icon}</span><h2 className="font-display text-h3 text-ink-900">{title}</h2></div><div className="min-h-56">{children}</div></div>; }
type ChartDatum = { label: string; value?: number; receita?: number; gastos?: number; investimento?: number };

function FinancialChart({ variant, data }: { variant: 'flow' | 'category' | 'pie' | 'horizontal'; data: ChartDatum[] }) {
  if (!data.length) return <div className="flex h-64 items-center justify-center text-sm text-ink-500">Sem dados no período</div>;
  const colors = ['#5872C9', '#7E93D9', '#5A9F7E', '#D9A85C', '#C97F7F', '#BCC9EC', '#455CAB', '#5A6478'];
  const tooltipStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E5E2D9', borderRadius: 8, color: '#1A2233' };

  if (variant === 'pie') return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="label" cx="42%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={2}>{data.map((item, index) => <Cell key={item.label} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} /><Legend wrapperStyle={{ color: '#5A6478', fontSize: 12 }} /></PieChart></ResponsiveContainer>;
  if (variant === 'flow') return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><CartesianGrid stroke="#E5E2D9" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fill: '#8B93A5', fontSize: 11 }} /><YAxis tick={{ fill: '#8B93A5', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} /><Legend wrapperStyle={{ color: '#5A6478', fontSize: 12 }} /><Bar dataKey="receita" name="Entrou" fill="#5A9F7E" radius={[5, 5, 0, 0]} /><Bar dataKey="gastos" name="Saiu" fill="#C97F7F" radius={[5, 5, 0, 0]} /><Bar dataKey="investimento" name="Investido" fill="#5872C9" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data} layout={variant === 'horizontal' ? 'vertical' : 'horizontal'} margin={{ left: 8, right: 14, top: 8, bottom: 8 }}><CartesianGrid stroke="#E5E2D9" strokeDasharray="3 3" horizontal={variant === 'horizontal'} vertical={variant !== 'horizontal'} />{variant === 'horizontal' ? <><XAxis type="number" tick={{ fill: '#8B93A5', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} /><YAxis dataKey="label" type="category" width={100} tick={{ fill: '#5A6478', fontSize: 11 }} /></> : <><XAxis dataKey="label" tick={{ fill: '#5A6478', fontSize: 11 }} /><YAxis tick={{ fill: '#8B93A5', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} /></>}<Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} /><Bar dataKey="value" name="Valor" fill="#5872C9" radius={variant === 'horizontal' ? [0, 5, 5, 0] : [5, 5, 0, 0]}>{data.map((item, index) => <Cell key={item.label} fill={colors[index % colors.length]} />)}</Bar></BarChart></ResponsiveContainer>;
}
function TransactionRow({ item, onEdit, onDelete }: { item: Transacao; onEdit: () => void; onDelete: () => void }) { const type = transactionType(item); return <tr className="hover:bg-canvas-100"><td className="px-5 py-3 text-ink-500">{dateLabel(item.data)}</td><td className="px-3 py-3 font-medium text-ink-900">{item.descricao || 'Sem descrição'}</td><td className="px-3 py-3 text-ink-500">{item.categoria?.nome ?? 'Sem categoria'}</td><td className="px-3 py-3"><span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ color: chartColor(type), backgroundColor: `${chartColor(type)}20` }}>{typeLabel(type)}{item.parcela_total ? ` ${item.parcela_atual}/${item.parcela_total}` : ''}</span></td><td className="px-3 py-3 text-ink-500">{item.responsavel?.nome ?? '—'}</td><td className="px-3 py-3 text-xs text-ink-500">{item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : '—'}{item.conta?.instituicao ? <span className="ml-1 text-brand-600">· {item.conta.instituicao}</span> : null}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${item.tipo === 'receita' ? 'text-state-success' : 'text-state-error'}`}>{item.tipo === 'receita' ? '+' : '-'} {money(Number(item.valor))}</td><td className="px-5 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={onEdit} className="icon-button" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={onDelete} className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>; }
EOF

# ---------- ALTERAR: household.service.ts ----------
cat << 'EOF' > src/core/household/household.service.ts
import { supabase } from '@/lib/supabase';
import { garantirPerfil } from '@/core/auth/auth.service';
import { buildSeedCategorias } from '@/modules/financeiro/utils/seedCategorias';
import { buildSeedResponsaveis } from '@/modules/financeiro/utils/seedResponsaveis';
import type {
  CreateHouseholdInput,
  Household,
  HouseholdMember,
  HouseholdWithMembership,
} from './types';

export const ACTIVE_HOUSEHOLD_STORAGE_KEY = 'mylife:household_ativo';
export const NO_ACTIVE_HOUSEHOLD_ID = '__sem_familia__';

export function getStoredActiveHouseholdId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.localStorage.getItem(ACTIVE_HOUSEHOLD_STORAGE_KEY);
  return storedValue && storedValue.trim().length > 0 ? storedValue : null;
}

export function setStoredActiveHouseholdId(householdId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!householdId) {
    window.localStorage.setItem(ACTIVE_HOUSEHOLD_STORAGE_KEY, NO_ACTIVE_HOUSEHOLD_ID);
    return;
  }

  window.localStorage.setItem(ACTIVE_HOUSEHOLD_STORAGE_KEY, householdId);
}

export async function listarHouseholdsDoUsuario(
  userId: string,
): Promise<HouseholdWithMembership[]> {
  const { data: membershipsData, error: membershipsError } = await supabase
    .from('household_membros')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (membershipsError) {
    throw membershipsError;
  }

  const memberships = (membershipsData ?? []) as HouseholdMember[];

  if (memberships.length === 0) {
    return [];
  }

  const householdIds = memberships.map((membership) => membership.household_id);

  const { data: householdsData, error: householdsError } = await supabase
    .from('households')
    .select('*')
    .in('id', householdIds)
    .order('created_at', { ascending: true });

  if (householdsError) {
    throw householdsError;
  }

  const households = (householdsData ?? []) as Household[];
  const householdsById = new Map<string, Household>();

  households.forEach((household) => {
    householdsById.set(household.id, household);
  });

  const householdList: HouseholdWithMembership[] = memberships
    .map((membership) => {
      const household = householdsById.get(membership.household_id);

      if (!household) {
        return null;
      }

      return {
        ...household,
        membership,
      };
    })
    .filter((household): household is HouseholdWithMembership => household !== null);

  return householdList;
}

export async function createHousehold(
  userId: string,
  input: CreateHouseholdInput,
): Promise<HouseholdWithMembership> {
  const nome = input.nome.trim();

  if (!nome) {
    throw new Error('O nome da família é obrigatório.');
  }

  await garantirPerfil(userId);

  const { data: householdData, error: householdError } = await supabase
    .from('households')
    .insert({
      nome,
      created_by: userId,
    })
    .select('*')
    .single();

  if (householdError) {
    throw householdError;
  }

  const household = householdData as Household;

  const { data: membershipData, error: membershipError } = await supabase
    .from('household_membros')
    .insert({
      household_id: household.id,
      user_id: userId,
      papel: 'owner',
    })
    .select('*')
    .single();

  if (membershipError) {
    const { error: rollbackError } = await supabase
      .from('households')
      .delete()
      .eq('id', household.id);

    if (rollbackError) {
      throw new Error(
        'Não foi possível criar a família e a associação ao usuário. Tente novamente.',
      );
    }

    throw membershipError;
  }

  try {
    const seedCategorias = buildSeedCategorias(household.id);

    if (seedCategorias.length > 0) {
      const { error: seedCategoriasError } = await supabase.from('categorias').insert(seedCategorias);

      if (seedCategoriasError) {
        throw seedCategoriasError;
      }
    }

    const seedResponsaveis = buildSeedResponsaveis(household.id);

    if (seedResponsaveis.length > 0) {
      const { error: seedResponsaveisError } = await supabase.from('responsaveis').insert(seedResponsaveis);

      if (seedResponsaveisError) {
        throw seedResponsaveisError;
      }
    }
  } catch {
    await supabase.from('household_membros').delete().eq('household_id', household.id);
    await supabase.from('households').delete().eq('id', household.id);

    throw new Error(
      'Não foi possível criar as categorias e responsáveis padrão da família. A criação foi cancelada.',
    );
  }

  return {
    ...household,
    membership: membershipData as HouseholdMember,
  };
}

export async function deleteHousehold(
  userId: string,
  householdId: string,
): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .delete()
    .eq('id', householdId)
    .eq('created_by', userId)
    .select('*');

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      'Não foi possível excluir a família. Verifique se você ainda tem permissão.',
    );
  }

  return data[0] as Household;
}

export const criarHousehold = createHousehold;
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git status                  (deve listar 4 novos + 5 modificados)"
echo "  2. npm run typecheck           (confirma que não quebrou tipos)"
echo "  3. npm run dev                 (testa no navegador)"
echo "  4. Testar: criar família nova, adicionar lançamento com responsável, editar"
echo "  5. Se estiver OK: git add . && git commit -m \"feat: adiciona campo responsavel no lancamento\" && git push"
echo ""
