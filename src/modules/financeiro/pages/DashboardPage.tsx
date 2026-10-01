import { useMemo, useState, type ReactNode } from 'react';
import { addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, ChevronLeft, ChevronRight, Download, Home, Infinity, Pencil, PiggyBank, Plus, Scale, Tag, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
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
  return item.categoria?.natureza === 'investimento' ? 'investimento' : 'despesa';
}
function typeLabel(type: LancamentoTipo) { return { receita: 'Receita', despesa: 'Despesa', investimento: 'Investimento' }[type]; }
function chartColor(type: LancamentoTipo) { return { receita: '#5A9F7E', despesa: '#C97F7F', investimento: '#5872C9' }[type]; }

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
  const { activeHousehold, hasHousehold } = useHousehold();
  const podeEditar = podeEscreverNoHousehold(activeHousehold?.membership.papel);
  const [mode, setMode] = useState<PeriodMode>('mes');
  const [reference, setReference] = useState(new Date());
  const range = useMemo(() => getRange(mode, reference), [mode, reference]);
  const { transacoes, isLoading, isError, error, criarTransacao, atualizarTransacao, excluirTransacao, isCreating, isUpdating } = useTransacoes(range.inicio, range.fim);
  const [editing, setEditing] = useState<Transacao | null>(null);
  const [deleting, setDeleting] = useState<Transacao | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterNature, setFilterNature] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterCardMode, setFilterCardMode] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMinValue, setFilterMinValue] = useState('');
  const [filterMaxValue, setFilterMaxValue] = useState('');
  const [onlyInstallments, setOnlyInstallments] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [expenseDimension, setExpenseDimension] = useState<ChartDimension>('categoria');
  const [incomeDimension, setIncomeDimension] = useState<ChartDimension>('categoria');
  const editingValues = useMemo(() => editing ? toFormValues(editing) : undefined, [editing]);

  const summary = useMemo(() => {
    const receitas = transacoes.filter((item) => item.tipo === 'receita').reduce((sum, item) => sum + Number(item.valor), 0);
    const gastos = transacoes.filter((item) => transactionType(item) === 'despesa').reduce((sum, item) => sum + Number(item.valor), 0);
    const fixos = transacoes.filter((item) => item.categoria?.natureza === 'fixo').reduce((sum, item) => sum + Number(item.valor), 0);
    const investimentos = transacoes.filter((item) => transactionType(item) === 'investimento').reduce((sum, item) => sum + Number(item.valor), 0);
    const base = receitas;
    return { receitas, gastos, fixos, investimentos, balanco: receitas - gastos - investimentos, comprometida: base ? (gastos / base) * 100 : 0, base };
  }, [transacoes]);

  const categories = useMemo(() => [...new Set(transacoes.map((item) => item.categoria?.nome).filter((value): value is string => Boolean(value)))].sort(), [transacoes]);
  const accounts = useMemo(() => [...new Set(transacoes.map((item) => item.conta?.instituicao ?? item.conta?.nome).filter((value): value is string => Boolean(value)))].sort(), [transacoes]);
  const responsaveis = useMemo(() => [...new Set(transacoes.map((item) => item.responsavel?.nome).filter((value): value is string => Boolean(value)))].sort(), [transacoes]);
  const filtered = useMemo(() => transacoes.filter((item) => {
    const type = transactionType(item);
    const nature = item.tipo === 'despesa' ? item.categoria?.natureza ?? '' : '';
    const text = `${item.descricao} ${item.observacao ?? ''}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!filterType || type === filterType)
      && (!filterNature || nature === filterNature) && (!filterCategory || item.categoria?.nome === filterCategory)
      && (!filterAccount || (item.conta?.instituicao ?? item.conta?.nome) === filterAccount)
      && (!filterPayment || item.forma_pagamento === filterPayment)
      && (!filterCardMode || item.tipo_no_cartao === filterCardMode)
      && (!filterResponsible || item.responsavel?.nome === filterResponsible)
      && (!filterStatus || item.status === filterStatus)
      && (!filterDateFrom || item.data >= filterDateFrom)
      && (!filterDateTo || item.data <= filterDateTo)
      && (!filterMinValue || Number(item.valor) >= Number(filterMinValue))
      && (!filterMaxValue || Number(item.valor) <= Number(filterMaxValue))
      && (!onlyInstallments || Boolean(item.parcela_total));
  }), [filterAccount, filterCardMode, filterCategory, filterDateFrom, filterDateTo, filterMaxValue, filterMinValue, filterNature, filterPayment, filterResponsible, filterStatus, filterType, onlyInstallments, search, transacoes]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, { label: string; receita: number; gastos: number }>();
    transacoes.forEach((item) => {
      const date = new Date(`${item.data}T12:00:00`);
      const key = mode === 'ano' || mode === 'tudo' ? format(date, 'yyyy-MM') : mode === 'mes' ? `S${Math.ceil(date.getDate() / 7)}` : item.data;
      const label = mode === 'ano' || mode === 'tudo' ? format(date, 'MMM/yy', { locale: ptBR }) : mode === 'mes' ? key : format(date, mode === 'dia' ? 'HH:mm' : 'dd/MM');
      const bucket = buckets.get(key) ?? { label, receita: 0, gastos: 0 };
      if (item.tipo === 'receita') bucket.receita += Number(item.valor);
      else bucket.gastos += Number(item.valor);
      buckets.set(key, bucket);
    });
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [mode, transacoes]);

  const expenseData = useMemo(() => aggregateByDimension(transacoes.filter((item) => transactionType(item) === 'despesa'), expenseDimension), [expenseDimension, transacoes]);
  const incomeData = useMemo(() => aggregateByDimension(transacoes.filter((item) => item.tipo === 'receita'), incomeDimension), [incomeDimension, transacoes]);

  async function saveLaunch(values: TransacaoFormValues) {
    try {
      if (editing) { await atualizarTransacao({ id: editing.id, values }); setEditing(null); toast.success('Lançamento atualizado.'); }
      else { await criarTransacao(values); toast.success('Lançamento adicionado.'); }
    } catch (saveError) { toast.error(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o lançamento.'); }
  }
  async function confirmDeleteLaunch() {
    if (!deleting) return;
    try { await excluirTransacao(deleting.id); if (editing?.id === deleting.id) setEditing(null); toast.success('Lançamento excluído.'); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o lançamento.'); }
    finally { setDeleting(null); }
  }
  function movePeriod(direction: number) {
    if (mode === 'tudo') return;
    setReference((value) => mode === 'dia' ? addDays(value, direction) : mode === 'semana' ? addWeeks(value, direction) : mode === 'ano' ? addYears(value, direction) : addMonths(value, direction));
  }
  function exportCsv() {
    const rows = [['Data', 'Descrição', 'Observação', 'Tipo', 'Natureza', 'Categoria', 'Forma de pagamento', 'Compra no cartão', 'Instituição', 'Responsável', 'Status', 'Parcela', 'Valor'], ...filtered.map((item) => [item.data, item.descricao, item.observacao ?? '', typeLabel(transactionType(item)), item.categoria?.natureza ?? '', item.categoria?.nome ?? '', item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : '', item.tipo_no_cartao ?? '', item.conta?.instituicao ?? item.conta?.nome ?? '', item.responsavel?.nome ?? '', item.status, item.parcela_total ? `${item.parcela_atual}/${item.parcela_total}` : '', String(item.valor).replace('.', ',')])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `mylife-${mode}-${dateInput(reference)}.csv`; anchor.click(); URL.revokeObjectURL(url); toast.success('CSV exportado.');
  }
  if (!hasHousehold) return <EmptyState title="Espaço pessoal indisponível" description="Não foi possível preparar seu espaço individual. Atualize a página e tente novamente." />;
  if (isError) return <EmptyState title="Não foi possível carregar o financeiro" description={error instanceof Error ? error.message : 'Tente novamente.'} />;

  return <div className="mx-auto max-w-[1400px] space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600 shadow-glow"><Wallet className="h-6 w-6" /></div><div><h1 className="font-display text-h2 font-semibold text-ink-900">Financeiro</h1><p className="text-xs text-ink-500">{podeEditar ? 'Resumo e controle financeiro' : 'Visualização dos dados financeiros'}</p></div></div><button type="button" onClick={() => setShowCategories(true)} className="btn-ghost flex items-center gap-2 text-sm"><Tag className="h-4 w-4" />Categorias</button></header>
    <section className="card flex flex-wrap items-center justify-between gap-4 p-3"><div className="flex flex-wrap gap-1 rounded-lg border border-canvas-300 bg-canvas-100 p-1">{modes.map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize transition ${mode === item ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-900'}`}>{item === 'tudo' ? <Infinity className="inline h-3.5 w-3.5" /> : item}</button>)}</div><div className="flex items-center gap-2"><button type="button" onClick={() => movePeriod(-1)} disabled={mode === 'tudo'} className="icon-button" aria-label="Período anterior"><ChevronLeft className="h-4 w-4" /></button><div className="min-w-48 rounded-lg border border-canvas-300 bg-canvas-100 px-4 py-2 text-center text-sm font-semibold text-ink-900">{periodLabel(mode, reference)}</div><button type="button" onClick={() => movePeriod(1)} disabled={mode === 'tudo'} className="icon-button" aria-label="Próximo período"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => setReference(new Date())} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">Hoje</button></div></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><Kpi label="Receitas" value={summary.receitas} sub="Entradas no período" icon={<TrendingUp />} tone="success" /><Kpi label="Despesas" value={summary.gastos} sub="Saídas no período" icon={<TrendingDown />} tone="error" /><Kpi label="Balanço" value={summary.balanco} sub={summary.balanco >= 0 ? 'Você fechou no positivo' : 'Atenção ao resultado'} icon={<Scale />} tone={summary.balanco >= 0 ? 'success' : 'error'} /><Kpi label="Despesas fixas" value={summary.fixos} sub="Custos recorrentes" icon={<Home />} tone="info" /><Kpi label="Investimentos" value={summary.investimentos} sub="Aportes registrados" icon={<PiggyBank />} tone="success" /><div className="card p-4"><p className="kpi-label">Renda comprometida</p><p className="mt-3 font-display text-xl font-semibold text-state-alert">{summary.base ? `${summary.comprometida.toFixed(1)}%` : '—'}</p><p className="mt-2 text-xs text-ink-500">{summary.base ? `${money(summary.gastos)} sobre ${money(summary.base)}` : 'Informe sua renda'}</p></div></section>
    {podeEditar ? <section className="card p-5"><div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-state-success" /><div><h2 className="font-display text-h3 text-ink-900">Novo lançamento</h2><p className="text-xs text-ink-500">Registre uma receita, despesa ou investimento.</p></div></div><LancamentoForm isSubmitting={isCreating} onSubmit={saveLaunch} /></section> : <div className="rounded-xl border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">Seu acesso neste espaço é somente para visualizar os dados.</div>}
    <section className="grid gap-4 lg:grid-cols-2"><ChartCard title="Entrou vs Saiu" icon={<BarChart3 />}><FinancialChart variant="flow" data={chartData} /></ChartCard><DimensionChart title="Despesa por" icon={<TrendingDown />} dimension={expenseDimension} onDimensionChange={setExpenseDimension} data={expenseData} /><DimensionChart title="Receita por" icon={<TrendingUp />} dimension={incomeDimension} onDimensionChange={setIncomeDimension} data={incomeData} /></section>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas-300 p-5"><div><h2 className="font-display text-h3 text-ink-900">Lançamentos detalhados</h2><p className="mt-1 text-xs text-ink-500">{filtered.length} registro(s) · {periodLabel(mode, reference)}</p></div><button type="button" onClick={exportCsv} className="btn-ghost flex items-center gap-2 text-sm"><Download className="h-4 w-4" />Exportar CSV / Excel</button></div>
      <div className="grid gap-2 border-b border-canvas-300 bg-canvas-100 p-4 sm:grid-cols-2 lg:grid-cols-4"><label><span className="label-base">Descrição / observação</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar texto" className="input-base" /></label><FilterSelect label="Tipo" value={filterType} onChange={setFilterType} options={(['receita', 'despesa', 'investimento'] as LancamentoTipo[]).map((type) => [type, typeLabel(type)])} /><FilterSelect label="Natureza" value={filterNature} onChange={setFilterNature} options={[["fixo", "Fixa"], ["variavel", "Variável"], ["investimento", "Investimento"]]} /><FilterSelect label="Categoria" value={filterCategory} onChange={setFilterCategory} options={categories.map((name) => [name, name])} /><FilterSelect label="Instituição" value={filterAccount} onChange={setFilterAccount} options={accounts.map((name) => [name, name])} /><FilterSelect label="Pagamento" value={filterPayment} onChange={setFilterPayment} options={Object.entries(formaPagamentoLabels)} /><FilterSelect label="Cartão de crédito" value={filterCardMode} onChange={setFilterCardMode} options={[["avista", "À vista"], ["parcelado", "Parcelado"]]} /><FilterSelect label="Responsável" value={filterResponsible} onChange={setFilterResponsible} options={responsaveis.map((name) => [name, name])} /><FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[["concluida", "Concluído"], ["pendente", "Pendente"]]} /><label><span className="label-base">Data inicial</span><input type="date" value={filterDateFrom} onChange={(event) => setFilterDateFrom(event.target.value)} className="input-base" /></label><label><span className="label-base">Data final</span><input type="date" value={filterDateTo} onChange={(event) => setFilterDateTo(event.target.value)} className="input-base" /></label><label><span className="label-base">Valor mínimo</span><input type="number" min="0" step="0.01" value={filterMinValue} onChange={(event) => setFilterMinValue(event.target.value)} className="input-base" /></label><label><span className="label-base">Valor máximo</span><input type="number" min="0" step="0.01" value={filterMaxValue} onChange={(event) => setFilterMaxValue(event.target.value)} className="input-base" /></label><button type="button" onClick={() => setOnlyInstallments((value) => !value)} className={`btn-ghost self-end text-xs ${onlyInstallments ? 'border-brand-400 text-brand-600' : ''}`}>Somente parcelados</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1550px] text-left text-sm"><thead className="border-b border-canvas-300 text-xs uppercase tracking-wider text-ink-500"><tr><th className="px-4 py-3">Data</th><th className="px-3 py-3">Descrição</th><th className="px-3 py-3">Observação</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Natureza</th><th className="px-3 py-3">Categoria</th><th className="px-3 py-3">Instituição</th><th className="px-3 py-3">Pagamento</th><th className="px-3 py-3">Cartão / parcela</th><th className="px-3 py-3">Responsável</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Valor</th>{podeEditar ? <th className="px-4 py-3 text-right">Ações</th> : null}</tr></thead><tbody className="divide-y divide-canvas-300">{filtered.map((item) => <TransactionRow key={item.id} item={item} podeEditar={podeEditar} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />)}</tbody></table>{isLoading ? <div className="p-8 text-center text-sm text-ink-500">Carregando...</div> : !filtered.length ? <div className="p-8"><EmptyState title="Nenhum lançamento encontrado" description="Ajuste os filtros ou crie um novo lançamento." /></div> : null}</div></section>
    <Modal open={Boolean(editing)} title="Editar lançamento" description="Altere os dados e salve para atualizar este lançamento." onClose={() => setEditing(null)} maxWidth="max-w-5xl">{editing && editingValues ? <LancamentoForm key={editing.id} initialValues={editingValues} isSubmitting={isUpdating} onSubmit={saveLaunch} onCancel={() => setEditing(null)} /> : null}</Modal>
    <ConfirmDialog open={Boolean(deleting)} title="Excluir lançamento" description={deleting ? `Deseja excluir “${deleting.descricao}”? Esta ação não pode ser desfeita.` : ''} confirmLabel="Excluir lançamento" cancelLabel="Cancelar" onConfirm={() => void confirmDeleteLaunch()} onCancel={() => setDeleting(null)} danger />
    <Modal open={showCategories} title="Categorias" description="Gerencie as categorias do Financeiro sem sair do dashboard." onClose={() => setShowCategories(false)} maxWidth="max-w-2xl"><CategoriasManager /></Modal>
  </div>;
}

function toFormValues(item: Transacao): TransacaoFormValues { return { tipo: transactionType(item), natureza: item.categoria?.natureza === 'fixo' ? 'fixo' : 'variavel', valor: Number(item.valor), data: item.data, descricao: item.descricao, observacao: item.observacao ?? '', categoria_id: item.categoria_id ?? '', conta_id: item.conta_id ?? '', responsavel_id: item.responsavel_id ?? '', forma_pagamento: item.forma_pagamento ?? 'pix', status: item.status, parcela_atual: item.parcela_atual, parcela_total: item.parcela_total, tipo_no_cartao: item.tipo_no_cartao }; }
type ChartDimension = 'categoria' | 'instituicao' | 'forma_pagamento' | 'descricao' | 'responsavel';
const chartDimensions: Array<[ChartDimension, string]> = [['categoria', 'Categoria'], ['instituicao', 'Instituição'], ['forma_pagamento', 'Forma de pagamento'], ['descricao', 'Descrição'], ['responsavel', 'Responsável']];
function aggregateByDimension(items: Transacao[], dimension: ChartDimension) {
  const values = new Map<string, number>();
  items.forEach((item) => {
    const label = dimension === 'categoria' ? item.categoria?.nome
      : dimension === 'instituicao' ? item.conta?.instituicao ?? item.conta?.nome
        : dimension === 'forma_pagamento' ? item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : null
          : dimension === 'responsavel' ? item.responsavel?.nome : item.descricao;
    const key = label?.trim() || 'Não informado';
    values.set(key, (values.get(key) ?? 0) + Number(item.valor));
  });
  return [...values.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
}
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) { return <label><span className="label-base">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="input-base"><option value="">Todos</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function DimensionChart({ title, icon, dimension, onDimensionChange, data }: { title: string; icon: ReactNode; dimension: ChartDimension; onDimensionChange: (dimension: ChartDimension) => void; data: ChartDatum[] }) { return <ChartCard title={title} icon={icon}><label className="mb-3 block max-w-xs"><span className="label-base">Agrupar por</span><select value={dimension} onChange={(event) => onDimensionChange(event.target.value as ChartDimension)} className="input-base">{chartDimensions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><FinancialChart variant="horizontal" data={data} /></ChartCard>; }

function Kpi({ label, value, sub, icon, tone }: { label: string; value: number; sub: string; icon: ReactNode; tone: string }) { return <div className="card p-4"><div className="flex items-center justify-between"><p className="kpi-label">{label}</p><span className={`rounded-lg p-2 ${tone === 'error' ? 'bg-state-error/10 text-state-error' : tone === 'info' ? 'bg-state-info/10 text-state-info' : 'bg-state-success/10 text-state-success'}`}>{icon}</span></div><p className={`mt-3 font-display text-xl font-semibold ${tone === 'error' ? 'text-state-error' : tone === 'info' ? 'text-state-info' : 'text-state-success'}`}>{money(value)}</p><p className="mt-1 text-xs text-ink-500">{sub}</p></div>; }
function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) { return <div className="card p-5"><div className="mb-4 flex items-center gap-2"><span className="text-brand-600">{icon}</span><h2 className="font-display text-h3 text-ink-900">{title}</h2></div><div className="min-h-56">{children}</div></div>; }
type ChartDatum = { label: string; value?: number; receita?: number; gastos?: number };

function FinancialChart({ variant, data }: { variant: 'flow' | 'horizontal'; data: ChartDatum[] }) {
  if (!data.length) return <div className="flex h-64 items-center justify-center text-sm text-ink-500">Sem dados no período</div>;
  const colors = ['#5872C9', '#7E93D9', '#5A9F7E', '#D9A85C', '#C97F7F', '#BCC9EC', '#455CAB', '#5A6478'];
  const tooltipStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E5E2D9', borderRadius: 8, color: '#1A2233' };

  if (variant === 'flow') return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><CartesianGrid stroke="#E5E2D9" strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fill: '#8B93A5', fontSize: 11 }} /><YAxis tick={{ fill: '#8B93A5', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} /><Legend wrapperStyle={{ color: '#5A6478', fontSize: 12 }} /><Bar dataKey="receita" name="Entrou" fill="#5A9F7E" radius={[5, 5, 0, 0]} /><Bar dataKey="gastos" name="Saiu" fill="#C97F7F" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data} layout={variant === 'horizontal' ? 'vertical' : 'horizontal'} margin={{ left: 8, right: 14, top: 8, bottom: 8 }}><CartesianGrid stroke="#E5E2D9" strokeDasharray="3 3" horizontal={variant === 'horizontal'} vertical={variant !== 'horizontal'} />{variant === 'horizontal' ? <><XAxis type="number" tick={{ fill: '#8B93A5', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} /><YAxis dataKey="label" type="category" width={100} tick={{ fill: '#5A6478', fontSize: 11 }} /></> : <><XAxis dataKey="label" tick={{ fill: '#5A6478', fontSize: 11 }} /><YAxis tick={{ fill: '#8B93A5', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} /></>}<Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} /><Bar dataKey="value" name="Valor" fill="#5872C9" radius={variant === 'horizontal' ? [0, 5, 5, 0] : [5, 5, 0, 0]}>{data.map((item, index) => <Cell key={item.label} fill={colors[index % colors.length]} />)}</Bar></BarChart></ResponsiveContainer>;
}
function TransactionRow({ item, podeEditar, onEdit, onDelete }: { item: Transacao; podeEditar: boolean; onEdit: () => void; onDelete: () => void }) { const type = transactionType(item); return <tr className="hover:bg-canvas-100"><td className="px-4 py-3 text-ink-500">{dateLabel(item.data)}</td><td className="px-3 py-3 font-medium text-ink-900">{item.descricao || 'Sem descrição'}</td><td className="px-3 py-3 text-ink-500">{item.observacao || '—'}</td><td className="px-3 py-3"><span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ color: chartColor(type), backgroundColor: `${chartColor(type)}20` }}>{typeLabel(type)}</span></td><td className="px-3 py-3 text-ink-500">{item.categoria?.natureza === 'fixo' ? 'Fixa' : item.categoria?.natureza === 'variavel' ? 'Variável' : item.categoria?.natureza === 'investimento' ? 'Investimento' : '—'}</td><td className="px-3 py-3 text-ink-500">{item.categoria?.nome ?? 'Sem categoria'}</td><td className="px-3 py-3 text-ink-500">{item.conta?.instituicao ?? item.conta?.nome ?? '—'}</td><td className="px-3 py-3 text-xs text-ink-500">{item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : '—'}</td><td className="px-3 py-3 text-xs text-ink-500">{item.tipo_no_cartao === 'parcelado' ? `Parcelado · ${item.parcela_atual}/${item.parcela_total}` : item.tipo_no_cartao === 'avista' ? 'À vista' : '—'}</td><td className="px-3 py-3 text-ink-500">{item.responsavel?.nome ?? '—'}</td><td className="px-3 py-3 text-ink-500">{item.status === 'concluida' ? 'Concluído' : 'Pendente'}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${item.tipo === 'receita' ? 'text-state-success' : 'text-state-error'}`}>{item.tipo === 'receita' ? '+' : '-'} {money(Number(item.valor))}</td>{podeEditar ? <td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={onEdit} className="icon-button" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={onDelete} className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button></div></td> : null}</tr>; }
