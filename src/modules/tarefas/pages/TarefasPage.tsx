import { useMemo, useState } from 'react';
import { CalendarCheck2, Check, Circle, Plus, Repeat2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHousehold } from '@/core/household/useHousehold';
import { useTarefas } from '../hooks/useTarefas';
import type { FrequenciaTarefa, Tarefa, TarefaInput } from '../types/tarefas.types';

const frequencies: Array<{ id: FrequenciaTarefa; label: string }> = [
  { id: 'diaria', label: 'Diárias' }, { id: 'semanal', label: 'Semanais' }, { id: 'mensal', label: 'Mensais' }, { id: 'anual', label: 'Anuais' },
];
const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const todayDate = new Date();
const localDate = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const today = localDate(todayDate);
const dateRange = () => {
  const start = new Date(todayDate.getFullYear(), 0, 1);
  const end = new Date(todayDate.getFullYear(), 11, 31);
  return { start: localDate(start), end: localDate(end) };
};
const { start, end } = dateRange();
const emptyForm: TarefaInput = { titulo: '', descricao: '', frequencia: 'diaria', dia_semana: todayDate.getDay(), dia_mes: todayDate.getDate(), mes: todayDate.getMonth() + 1 };
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function occurrenceDate(task: Tarefa): string {
  const now = new Date();
  if (task.frequencia === 'diaria') return today;
  if (task.frequencia === 'semanal') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setDate(weekStart.getDate() + (task.dia_semana ?? now.getDay()));
    return localDate(weekStart);
  }
  if (task.frequencia === 'mensal') {
    const day = Math.min(task.dia_mes ?? now.getDate(), new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    return localDate(new Date(now.getFullYear(), now.getMonth(), day));
  }
  const month = (task.mes ?? now.getMonth() + 1) - 1;
  const day = Math.min(task.dia_mes ?? now.getDate(), new Date(now.getFullYear(), month + 1, 0).getDate());
  return localDate(new Date(now.getFullYear(), month, day));
}

export default function TarefasPage() {
  const { hasHousehold } = useHousehold();
  const { tarefas, conclusoes, isLoading, isError, error, criarTarefa, excluirTarefa, definirConclusao, podeEscrever, isCreating } = useTarefas(start, end);
  const [frequency, setFrequency] = useState<FrequenciaTarefa>('diaria');
  const [form, setForm] = useState<TarefaInput>(emptyForm);
  const [deleting, setDeleting] = useState<Tarefa | null>(null);
  const visibleTasks = useMemo(() => tarefas.filter((task) => task.frequencia === frequency), [frequency, tarefas]);
  const doneByTask = new Set(conclusoes.filter((entry) => entry.data_referencia === today).map((entry) => entry.tarefa_id));
  const doneCount = visibleTasks.filter((task) => doneByTask.has(task.id)).length;
  const progress = visibleTasks.length ? Math.round(doneCount / visibleTasks.length * 100) : 0;

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await criarTarefa(form); setForm({ ...emptyForm, frequencia: frequency }); toast.success('Tarefa adicionada.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível criar a tarefa.'); }
  }
  async function handleToggle(task: Tarefa) {
    const date = occurrenceDate(task);
    try { await definirConclusao({ id: task.id, date, done: !conclusoes.some((item) => item.tarefa_id === task.id && item.data_referencia === date) }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível atualizar o progresso.'); }
  }
  async function handleDelete() {
    if (!deleting) return;
    try { await excluirTarefa(deleting.id); toast.success('Tarefa removida.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível remover a tarefa.'); }
    finally { setDeleting(null); }
  }

  if (!hasHousehold) return <EmptyState title="Espaço pessoal indisponível" description="Não foi possível preparar seu espaço individual. Atualize a página e tente novamente." />;
  if (isError) return <EmptyState title="Não foi possível carregar as tarefas" description={error instanceof Error ? error.message : 'Tente novamente.'} />;

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">Casa e rotina</p><h1 className="mt-2 flex items-center gap-3 font-display text-h1 font-semibold tracking-tight"><CalendarCheck2 className="h-8 w-8 text-brand-400" />Tarefas</h1><p className="mt-1 text-body text-content-secondary">Uma rotina clara, organizada pela frequência que funciona para você.</p></div><div className="text-right"><p className="font-display text-2xl font-semibold text-brand-400">{doneCount}<span className="text-base text-content-secondary"> / {visibleTasks.length}</span></p><p className="text-xs text-content-secondary">concluídas hoje</p></div></header>

    <section className="card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600"><Repeat2 className="h-4 w-4" />Seu ritmo</div><p className="mt-2 text-sm text-ink-500">Progresso das tarefas previstas para hoje.</p></div><p className="font-display text-2xl font-semibold tabular-nums text-ink-900">{progress}%</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas-300"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex flex-wrap gap-2">{frequencies.map((item) => <button key={item.id} type="button" onClick={() => { setFrequency(item.id); setForm((current) => ({ ...current, frequencia: item.id })); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${frequency === item.id ? 'bg-brand-600 text-white' : 'bg-canvas-200 text-ink-500 hover:text-ink-900'}`}>{item.label}<span className="ml-2 text-xs opacity-75">{tarefas.filter((task) => task.frequencia === item.id).length}</span></button>)}</div></section>

    {podeEscrever ? <section className="card p-5"><div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-brand-400" /><h2 className="font-display text-h3">Nova tarefa {frequency === 'diaria' ? 'diária' : frequency === 'semanal' ? 'semanal' : frequency === 'mensal' ? 'mensal' : 'anual'}</h2></div>
      <form onSubmit={(event) => void handleCreate(event)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"><label className="lg:col-span-2"><span className="label-base">Tarefa</span><input required value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} className="input-base" placeholder="Ex.: Preparar refeições da semana" /></label><label><span className="label-base">Frequência</span><select value={form.frequencia} onChange={(event) => setForm((current) => ({ ...current, frequencia: event.target.value as FrequenciaTarefa }))} className="input-base">{frequencies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        {form.frequencia === 'semanal' ? <label><span className="label-base">Dia da semana</span><select value={form.dia_semana ?? todayDate.getDay()} onChange={(event) => setForm((current) => ({ ...current, dia_semana: Number(event.target.value) }))} className="input-base">{weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label> : null}
        {form.frequencia === 'mensal' ? <label><span className="label-base">Dia do mês</span><input type="number" min="1" max="31" value={form.dia_mes ?? 1} onChange={(event) => setForm((current) => ({ ...current, dia_mes: Number(event.target.value) }))} className="input-base" /></label> : null}
        {form.frequencia === 'anual' ? <><label><span className="label-base">Mês</span><select value={form.mes ?? 1} onChange={(event) => setForm((current) => ({ ...current, mes: Number(event.target.value) }))} className="input-base">{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label><label><span className="label-base">Dia do mês</span><input type="number" min="1" max="31" value={form.dia_mes ?? 1} onChange={(event) => setForm((current) => ({ ...current, dia_mes: Number(event.target.value) }))} className="input-base" /></label></> : null}
        <label className="lg:col-span-3"><span className="label-base">Observação (opcional)</span><input value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} className="input-base" placeholder="Detalhes para lembrar" /></label><button type="submit" disabled={isCreating} className="btn-primary flex items-center justify-center gap-2"><Plus className="h-4 w-4" />Adicionar</button>
      </form></section> : <div className="rounded-xl border border-navy-600 bg-navy-900 p-4 text-sm text-content-secondary">Seu acesso a estas tarefas é somente para visualizar.</div>}

    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-navy-600 p-4"><div><h2 className="font-display text-h3">Tarefas {frequency === 'diaria' ? 'diárias' : frequency === 'semanal' ? 'semanais' : frequency === 'mensal' ? 'mensais' : 'anuais'}</h2><p className="mt-1 text-xs text-content-secondary">Marque quando concluir; o progresso fica salvo por ocorrência.</p></div><span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-semibold text-brand-400">{doneCount}/{visibleTasks.length}</span></div>
      {isLoading ? <p className="p-8 text-center text-sm text-content-secondary">Carregando tarefas...</p> : visibleTasks.length === 0 ? <div className="p-5"><EmptyState title="Nenhuma tarefa nesta frequência" description={podeEscrever ? 'Cadastre a primeira tarefa para acompanhar seu progresso.' : 'Ainda não há tarefas cadastradas.'} /></div> : <div className="divide-y divide-navy-600">{visibleTasks.map((task) => { const due = occurrenceDate(task); const completed = conclusoes.some((entry) => entry.tarefa_id === task.id && entry.data_referencia === due); return <div key={task.id} className={`flex items-center gap-3 px-4 py-4 ${completed ? 'opacity-65' : ''}`}><button disabled={!podeEscrever} type="button" onClick={() => void handleToggle(task)} className="shrink-0 text-brand-400 disabled:cursor-default" aria-label={completed ? `Reabrir tarefa ${task.titulo}` : `Concluir tarefa ${task.titulo}`}>{completed ? <Check className="h-5 w-5 rounded-full bg-state-success p-0.5 text-white" /> : <Circle className="h-5 w-5" />}</button><div className="min-w-0 flex-1"><p className={`font-medium text-content-primary ${completed ? 'line-through' : ''}`}>{task.titulo}</p>{task.descricao ? <p className="mt-0.5 text-xs text-content-secondary">{task.descricao}</p> : null}<p className="mt-1 text-[11px] text-content-secondary">{task.frequencia === 'diaria' ? 'Todos os dias' : task.frequencia === 'semanal' ? `Toda ${weekDays[task.dia_semana ?? 0].toLowerCase()}` : task.frequencia === 'mensal' ? `Dia ${task.dia_mes} de cada mês` : `${task.dia_mes} de ${months[(task.mes ?? 1) - 1]}`}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${completed ? 'bg-state-success/10 text-state-success' : 'bg-brand-600/10 text-brand-400'}`}>{completed ? 'Concluída' : `Até ${new Date(`${due}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}</span>{podeEscrever ? <button type="button" onClick={() => setDeleting(task)} className="icon-button text-state-error" aria-label={`Remover ${task.titulo}`}><Trash2 className="h-4 w-4" /></button> : null}</div>; })}</div>}
    </section>
    {podeEscrever ? <ConfirmDialog open={Boolean(deleting)} title="Remover tarefa" description={deleting ? `Remover "${deleting.titulo}"? O histórico de conclusões permanece salvo.` : 'Tem certeza que deseja remover esta tarefa?'} confirmLabel="Remover" cancelLabel="Cancelar" onConfirm={() => void handleDelete()} onCancel={() => setDeleting(null)} danger /> : null}
  </div>;
}
