import { useMemo, useState } from 'react';
import { Check, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHousehold } from '@/core/household/useHousehold';
import { podeEscreverNoHousehold } from '@/core/household/permissoes';
import { ListaMercadoItemRow } from '../components/ListaMercadoItemRow';
import { useListaMercado } from '../hooks/useListaMercado';
import type { ListaMercadoItemInput, ListaMercadoStatus } from '../types/listaMercado.types';

type Filter = 'todos' | 'pendente' | 'comprado';

const emptyForm: ListaMercadoItemInput = { nome: '', quantidade: '', observacao: '' };

export default function ListaMercadoPage() {
  const { activeHousehold, hasHousehold } = useHousehold();
  const podeEditar = podeEscreverNoHousehold(activeHousehold?.membership.papel);
  const { itens, isLoading, isError, error, criarItem, atualizarStatus, excluirItem, isCreating, isDeleting } = useListaMercado();
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<Filter>('todos');
  const [deleting, setDeleting] = useState<{ id: string; nome: string } | null>(null);

  const visibleItems = useMemo(() => filter === 'todos' ? itens : itens.filter((item) => item.status === filter), [filter, itens]);
  const pendingCount = itens.filter((item) => item.status === 'pendente').length;
  const boughtCount = itens.filter((item) => item.status === 'comprado').length;

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim()) return;
    try {
      await criarItem(form);
      setForm(emptyForm);
      toast.success('Item adicionado à lista.');
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'Não foi possível adicionar o item.');
    }
  }

  async function handleToggle(id: string, status: ListaMercadoStatus) {
    try {
      await atualizarStatus({ id, status: status === 'comprado' ? 'pendente' : 'comprado' });
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar o item.');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await excluirItem(deleting.id);
      toast.success('Item removido da lista.');
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o item.');
    } finally {
      setDeleting(null);
    }
  }

  if (!hasHousehold) return <EmptyState title="Espaço pessoal indisponível" description="Não foi possível preparar seu espaço individual. Atualize a página e tente novamente." />;
  if (isError) return <EmptyState title="Não foi possível carregar a lista" description={error instanceof Error ? error.message : 'Tente novamente.'} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Segundo módulo</p>
          <h1 className="mt-2 flex items-center gap-3 font-display text-h1 font-semibold tracking-tight"><ShoppingCart className="h-8 w-8 text-brand-400" />Lista de Mercado</h1>
          <p className="mt-1 text-body text-content-secondary">{podeEditar ? 'Organize o que precisa comprar e marque o que já foi comprado.' : 'Visualize os itens e o status da lista.'}</p>
        </div>
        <div className="flex gap-3 text-center"><div><p className="font-display text-2xl font-semibold text-brand-400">{pendingCount}</p><p className="text-xs text-content-secondary">A comprar</p></div><div><p className="font-display text-2xl font-semibold text-state-success">{boughtCount}</p><p className="text-xs text-content-secondary">Comprados</p></div></div>
      </header>

      {podeEditar ? <section className="card p-5">
        <div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-brand-400" /><h2 className="font-display text-h3">Adicionar item</h2></div>
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1.5fr_0.7fr_1fr_auto] md:items-end">
          <label><span className="label-base">O que comprar</span><input required value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} className="input-base" placeholder="Ex: Arroz" /></label>
          <label><span className="label-base">Quantidade</span><input value={form.quantidade} onChange={(event) => setForm((current) => ({ ...current, quantidade: event.target.value }))} className="input-base" placeholder="Ex: 2 kg" /></label>
          <label><span className="label-base">Observação</span><input value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} className="input-base" placeholder="Opcional" /></label>
          <button type="submit" disabled={isCreating} className="btn-primary flex items-center justify-center gap-2"><Plus className="h-4 w-4" />{isCreating ? 'Adicionando...' : 'Adicionar'}</button>
        </form>
      </section> : <div className="rounded-xl border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">Seu acesso nesta lista é somente para visualizar.</div>}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-600 p-4"><div className="flex gap-1 rounded-lg border border-navy-600 bg-navy-900 p-1">{([['todos', `Todos (${itens.length})`], ['pendente', `A comprar (${pendingCount})`], ['comprado', `Comprados (${boughtCount})`]] as Array<[Filter, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${filter === value ? 'bg-brand-600 text-white' : 'text-content-secondary hover:text-content-primary'}`}>{label}</button>)}</div><span className="flex items-center gap-1 text-xs text-content-secondary"><Check className="h-3.5 w-3.5 text-state-success" />Lista do espaço ativo</span></div>
        {isLoading ? <p className="p-8 text-center text-sm text-content-secondary">Carregando lista...</p> : visibleItems.length === 0 ? <div className="p-5"><EmptyState title={filter === 'comprado' ? 'Nenhum item comprado' : 'Sua lista está vazia'} description={podeEditar ? 'Adicione os itens que você precisa comprar para começar.' : 'Ainda não há itens nesta lista.'} /></div> : <div>{visibleItems.map((item) => <ListaMercadoItemRow key={item.id} item={item} somenteLeitura={!podeEditar} onToggle={() => void handleToggle(item.id, item.status)} onDelete={() => setDeleting({ id: item.id, nome: item.nome })} />)}</div>}
      </section>

      {podeEditar ? <ConfirmDialog open={Boolean(deleting)} title="Excluir item" description={deleting ? `Tem certeza que deseja excluir "${deleting.nome}" da lista?` : 'Tem certeza que deseja excluir este item?'} confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir'} cancelLabel="Cancelar" onConfirm={() => void handleDelete()} onCancel={() => setDeleting(null)} danger /> : null}
    </div>
  );
}
