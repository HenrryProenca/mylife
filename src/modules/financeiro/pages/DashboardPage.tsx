import { useMemo, useRef, useState, type ReactNode } from 'react';
import { addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, ChevronLeft, ChevronRight, Download, Home, Infinity, Layers, Pencil, PiggyBank, Plus, Scale, Search, Tag, Trash2, TrendingDown, TrendingUp, Upload, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
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
  const { activeHousehold, hasHousehold } = useHousehold();
  const podeEditar = podeEscreverNoHousehold(activeHousehold?.membership.papel);
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
    if (!podeEditar) return;
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

  if (!hasHousehold) return <EmptyState title="Espaço pessoal indisponível" description="Não foi possível preparar seu espaço individual. Atualize a página e tente novamente." />;
  if (isError) return <EmptyState title="Não foi possível carregar o financeiro" description={error instanceof Error ? error.message : 'Tente novamente.'} />;

  return <div className="mx-auto max-w-[1400px] space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600 shadow-glow"><Wallet className="h-6 w-6" /></div><div><h1 className="font-display text-h2 font-semibold text-ink-900">Financeiro</h1><p className="text-xs text-ink-500">{podeEditar ? 'Resumo e controle financeiro' : 'Visualização dos dados financeiros'}</p></div></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setShowCategories(true)} className="btn-ghost flex items-center gap-2 text-sm"><Tag className="h-4 w-4" />Categorias</button>{podeEditar ? <button type="button" onClick={() => importRef.current?.click()} className="btn-ghost flex items-center gap-2 text-sm"><Upload className="h-4 w-4" />Importar</button> : null}<button type="button" onClick={exportCsv} className="btn-ghost flex items-center gap-2 text-sm"><Download className="h-4 w-4" />Exportar</button><input ref={importRef} type="file" accept=".csv,.txt" onChange={importCsv} className="hidden" /></div></header>
    <section className="card flex flex-wrap items-center justify-between gap-4 p-3"><div className="flex flex-wrap gap-1 rounded-lg border border-canvas-300 bg-canvas-100 p-1">{modes.map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize transition ${mode === item ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-900'}`}>{item === 'tudo' ? <Infinity className="inline h-3.5 w-3.5" /> : item}</button>)}</div><div className="flex items-center gap-2"><button type="button" onClick={() => movePeriod(-1)} disabled={mode === 'tudo'} className="icon-button" aria-label="Período anterior"><ChevronLeft className="h-4 w-4" /></button><div className="min-w-48 rounded-lg border border-canvas-300 bg-canvas-100 px-4 py-2 text-center text-sm font-semibold text-ink-900">{periodLabel(mode, reference)}</div><button type="button" onClick={() => movePeriod(1)} disabled={mode === 'tudo'} className="icon-button" aria-label="Próximo período"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => setReference(new Date())} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">Hoje</button></div></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><Kpi label="Receitas" value={summary.receitas} sub={`${transacoes.filter((item) => item.tipo === 'receita').length} entradas`} icon={<TrendingUp />} tone="success" /><Kpi label="Gastos totais" value={summary.gastos} sub={`${transacoes.filter((item) => item.tipo === 'despesa' && transactionType(item) !== 'investimento').length} saídas`} icon={<TrendingDown />} tone="error" /><Kpi label="Balanço" value={summary.balanco} sub={summary.balanco >= 0 ? 'Você fechou no positivo' : 'Atenção ao resultado'} icon={<Scale />} tone={summary.balanco >= 0 ? 'success' : 'error'} /><Kpi label="Gastos fixos" value={summary.fixos} sub="Custos recorrentes" icon={<Home />} tone="info" /><Kpi label="Investimentos" value={summary.investimentos} sub="Aportes registrados" icon={<PiggyBank />} tone="success" /><div className="card p-4"><p className="kpi-label"><span>Renda comprometida</span></p><p className="mt-3 font-display text-xl font-semibold text-state-alert">{summary.base ? `${summary.comprometida.toFixed(1)}%` : '—'}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-200"><div className="h-full rounded-full bg-brand-300" style={{ width: `${Math.min(summary.comprometida, 100)}%` }} /></div><p className="mt-2 text-xs text-ink-500">{summary.base ? `${money(summary.gastos)} sobre ${money(summary.base)}` : 'Informe sua renda'}</p></div></section>
    {podeEditar ? <section className="card p-5"><div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-state-success" /><div><h2 className="font-display text-h3 text-ink-900">Novo lançamento</h2><p className="text-xs text-ink-500">Registre receitas, gastos fixos, variáveis, cartão ou investimentos.</p></div>{editing ? <span className="ml-2 rounded-full bg-state-alert/15 px-2 py-1 text-xs text-state-alert">Editando</span> : null}</div><LancamentoForm key={editing?.id ?? 'new'} initialValues={editing ? toFormValues(editing) : undefined} isSubmitting={isCreating || isUpdating} onSubmit={saveLaunch} onCancel={editing ? () => setEditing(null) : undefined} /></section> : <div className="rounded-xl border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">Seu acesso neste espaço é somente para visualizar os dados.</div>}
    <section className="grid gap-4 lg:grid-cols-2"><ChartCard title="Entrou vs Saiu" icon={<BarChart3 />}><FinancialChart variant="flow" data={chartData} /></ChartCard><ChartCard title="Gastos por categoria" icon={<Tag />}><FinancialChart variant="category" data={categoryData} /></ChartCard><ChartCard title="Distribuição por tipo" icon={<Layers />}><FinancialChart variant="pie" data={typeData.map((item) => ({ ...item, label: typeLabel(item.label as LancamentoTipo) }))} /></ChartCard><ChartCard title="Gastos por forma de pagamento" icon={<Wallet />}><FinancialChart variant="horizontal" data={paymentData} /></ChartCard><ChartCard title="Gastos fixos por categoria" icon={<Home />}><FinancialChart variant="horizontal" data={aggregate(transacoes.filter((item) => transactionType(item) === 'fixo'), (item) => item.categoria?.nome ?? 'Sem categoria')} /></ChartCard><ChartCard title="Gastos por instituição" icon={<Wallet />}><FinancialChart variant="horizontal" data={accountData} /></ChartCard></section>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas-300 p-5"><div><h2 className="font-display text-h3 text-ink-900">Transações do período</h2><p className="mt-1 text-xs text-ink-500">{filtered.length} registro(s) · {periodLabel(mode, reference)}</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." className="input-base w-40 pl-8 text-xs" /></label><select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="input-base w-32 text-xs"><option value="">Todos os tipos</option>{(['receita', 'fixo', 'variavel', 'cartao', 'investimento'] as LancamentoTipo[]).map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}</select><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="input-base w-36 text-xs"><option value="">Categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={filterAccount} onChange={(event) => setFilterAccount(event.target.value)} className="input-base w-36 text-xs"><option value="">Instituições</option>{accounts.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => setOnlyInstallments((value) => !value)} className={`btn-ghost text-xs ${onlyInstallments ? 'border-brand-400 text-brand-600' : ''}`}><Layers className="h-3.5 w-3.5" />Parcelados</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="border-b border-canvas-300 text-xs uppercase tracking-wider text-ink-500"><tr><th className="px-5 py-3">Data</th><th className="px-3 py-3">Descrição</th><th className="px-3 py-3">Categoria</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Responsável</th><th className="px-3 py-3">Pagamento</th><th className="px-3 py-3 text-right">Valor</th>{podeEditar ? <th className="px-5 py-3 text-right">Ações</th> : null}</tr></thead><tbody className="divide-y divide-canvas-300">{filtered.map((item) => <TransactionRow key={item.id} item={item} podeEditar={podeEditar} onEdit={() => setEditing(item)} onDelete={() => deleteLaunch(item)} />)}</tbody></table>{isLoading ? <div className="p-8 text-center text-sm text-ink-500">Carregando...</div> : !filtered.length ? <div className="p-8"><EmptyState title="Nenhuma transação encontrada" description="Ajuste os filtros ou crie um novo lançamento." /></div> : null}</div></section>
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
function TransactionRow({ item, podeEditar, onEdit, onDelete }: { item: Transacao; podeEditar: boolean; onEdit: () => void; onDelete: () => void }) { const type = transactionType(item); return <tr className="hover:bg-canvas-100"><td className="px-5 py-3 text-ink-500">{dateLabel(item.data)}</td><td className="px-3 py-3 font-medium text-ink-900">{item.descricao || 'Sem descrição'}</td><td className="px-3 py-3 text-ink-500">{item.categoria?.nome ?? 'Sem categoria'}</td><td className="px-3 py-3"><span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ color: chartColor(type), backgroundColor: `${chartColor(type)}20` }}>{typeLabel(type)}{item.parcela_total ? ` ${item.parcela_atual}/${item.parcela_total}` : ''}</span></td><td className="px-3 py-3 text-ink-500">{item.responsavel?.nome ?? '—'}</td><td className="px-3 py-3 text-xs text-ink-500">{item.forma_pagamento ? formaPagamentoLabels[item.forma_pagamento] : '—'}{item.conta?.instituicao ? <span className="ml-1 text-brand-600">· {item.conta.instituicao}</span> : null}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${item.tipo === 'receita' ? 'text-state-success' : 'text-state-error'}`}>{item.tipo === 'receita' ? '+' : '-'} {money(Number(item.valor))}</td>{podeEditar ? <td className="px-5 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={onEdit} className="icon-button" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={onDelete} className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button></div></td> : null}</tr>; }
