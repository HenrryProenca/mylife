import { useMemo, useState } from 'react';
import { ArrowLeft, Archive, CalendarDays, Check, Circle, ClipboardList, History, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHousehold } from '@/core/household/useHousehold';
import { useListaMercado } from '../hooks/useListaMercado';
import type { Compra, CompraItem, ListaFixa, ListaMercadoItem, ListaMercadoItemInput, ListaMercadoStatus } from '../types/listaMercado.types';

const emptyForm: ListaMercadoItemInput = { nome: '', quantidade: '1', observacao: '', unidade: 'un', preco_referencia: '' };
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
const totalItems = (items: CompraItem[], actual = false) => items.reduce((sum, item) => sum + item.quantidade * Number((actual ? item.preco_real : item.preco_estimado) ?? 0), 0);

export default function ListaMercadoPage() {
  const { hasHousehold } = useHousehold();
  const { itens, compras, listasFixas, isLoading, isError, error, criarItem, atualizarComprado, excluirItem, editarItem, salvarHistorico, atualizarPreco, atualizarPrecoReal, salvarListaFixa, aplicarListaFixa, excluirListaFixa, excluirCompra, isCreating, podeEscrever } = useListaMercado();
  const [historyMode, setHistoryMode] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ListaMercadoItem | null>(null);
  const [compraData, setCompraData] = useState(today);
  const [filter, setFilter] = useState<'todos' | ListaMercadoStatus>('todos');
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<ListaMercadoItem | null>(null);
  const [confirmDeleteCompra, setConfirmDeleteCompra] = useState<Compra | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<ListaFixa | null>(null);
  const pending = itens.filter((item) => item.status === 'pendente').length;
  const bought = itens.filter((item) => item.status === 'comprado').length;
  const total = itens.filter((item) => item.status === 'comprado').reduce((sum, item) => sum + Number(item.quantidade ?? 1) * Number(item.preco_real ?? item.preco_referencia ?? 0), 0);
  const visibleItems = useMemo(() => filter === 'todos' ? itens : itens.filter((item) => item.status === filter), [filter, itens]);
  const history = compras.filter((compra) => compra.status === 'concluida');

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await criarItem(form); setForm(emptyForm); toast.success('Item adicionado à lista.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível adicionar o item.'); }
  }
  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    try { await editarItem({ id: editing.id, values: form }); setEditing(null); setForm(emptyForm); toast.success('Item atualizado.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível atualizar o item.'); }
  }
  async function handleToggle(item: ListaMercadoItem) {
    const next: ListaMercadoStatus = item.status === 'comprado' ? 'pendente' : 'comprado';
    try { await atualizarComprado({ item, status: next, date: compraData });
      toast.success(next === 'comprado' ? 'Item marcado como comprado.' : 'Item voltou para a lista.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível atualizar o item.'); }
  }
  async function handleDeleteItem() {
    if (!confirmDeleteItem) return;
    try { await excluirItem(confirmDeleteItem.id); toast.success('Item removido da lista.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível remover o item.'); }
    finally { setConfirmDeleteItem(null); }
  }
  async function handleSaveHistory() {
    if (!bought) { toast.error('Marque pelo menos um item como comprado antes de salvar.'); return; }
    try {
      await salvarHistorico({ date: compraData, items: itens.filter((item) => item.status === 'comprado') });
      await Promise.all(itens.filter((item) => item.status === 'comprado' && item.preco_real !== null && item.preco_real !== undefined).map((item) => atualizarPreco({ id: item.id, price: item.preco_real! })));
      await Promise.all(itens.filter((item) => item.status === 'comprado').map((item) => atualizarComprado({ item, status: 'pendente', date: compraData })));
      toast.success('Compra registrada no histórico; os itens voltaram para sua lista reutilizável.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível registrar a compra.'); }
  }
  async function handleSaveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!itens.length) { toast.error('Adicione itens antes de salvar uma lista fixa.'); return; }
    try { await salvarListaFixa({ name: templateName, items: itens }); setTemplateName(''); toast.success('Lista fixa salva.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar a lista fixa.'); }
  }
  async function handleApplyTemplate() {
    const template = listasFixas.find((lista) => lista.id === selectedTemplate);
    if (!template) return;
    try { await aplicarListaFixa(template); setSelectedTemplate(''); toast.success(`“${template.nome}” adicionada à lista atual.`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível reutilizar a lista.'); }
  }
  async function handleDeleteCompra() {
    if (!confirmDeleteCompra) return;
    try { await excluirCompra(confirmDeleteCompra.id); toast.success('Registro removido do histórico.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível excluir o registro.'); }
    finally { setConfirmDeleteCompra(null); }
  }
  async function handleDeleteTemplate() {
    if (!confirmDeleteTemplate) return;
    try { await excluirListaFixa(confirmDeleteTemplate.id); toast.success('Lista fixa removida.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível excluir a lista fixa.'); }
    finally { setConfirmDeleteTemplate(null); }
  }

  if (!hasHousehold) return <EmptyState title="Espaço pessoal indisponível" description="Não foi possível preparar seu espaço individual. Atualize a página e tente novamente." />;
  if (isError) return <EmptyState title="Não foi possível carregar a lista" description={error instanceof Error ? error.message : 'Tente novamente.'} />;

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">Casa e rotina</p><h1 className="mt-2 flex items-center gap-3 font-display text-h1 font-semibold tracking-tight"><ShoppingCart className="h-8 w-8 text-brand-400" />{historyMode ? 'Histórico de compras' : 'Lista de Mercado'}</h1><p className="mt-1 text-body text-content-secondary">{historyMode ? 'Consulte os itens, preços e datas das compras anteriores.' : 'Sua lista fica salva para marcar, editar e reaproveitar.'}</p></div>{historyMode ? <button type="button" onClick={() => setHistoryMode(false)} className="btn-secondary flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Voltar para a lista</button> : <button type="button" onClick={() => setHistoryMode(true)} className="btn-secondary flex items-center gap-2"><History className="h-4 w-4" />Histórico de compras <span className="rounded-full bg-brand-600/10 px-2 py-0.5 text-xs text-brand-600">{history.length}</span></button>}</header>

    {historyMode ? <section className="card overflow-hidden"><div className="border-b border-navy-600 p-4"><h2 className="font-display text-h3">Compras anteriores</h2><p className="mt-1 text-xs text-content-secondary">Cada registro preserva os itens e valores daquela data.</p></div>{isLoading ? <p className="p-8 text-center text-sm text-content-secondary">Carregando histórico...</p> : history.length === 0 ? <div className="p-5"><EmptyState title="Histórico vazio" description="As compras salvas aparecerão aqui." /></div> : <div className="divide-y divide-navy-600">{history.map((purchase) => { const purchaseItems = purchase.itens ?? []; return <details key={purchase.id} className="group"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 px-5 py-4"><CalendarDays className="h-5 w-5 text-brand-400" /><div className="min-w-36 flex-1"><p className="font-semibold text-content-primary">Compra de {dateLabel(purchase.data_compra)}</p><p className="text-xs text-content-secondary">{purchaseItems.length} {purchaseItems.length === 1 ? 'item' : 'itens'}</p></div><div className="text-right"><p className="font-semibold text-state-success">{money.format(totalItems(purchaseItems, true))}</p><p className="text-[11px] text-content-secondary">total registrado</p></div>{podeEscrever ? <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setConfirmDeleteCompra(purchase); }} className="icon-button text-state-error" aria-label={`Excluir compra de ${dateLabel(purchase.data_compra)}`}><Trash2 className="h-4 w-4" /></button> : null}<span className="text-xs text-content-secondary transition group-open:rotate-180">⌄</span></summary><div className="space-y-2 bg-navy-900/40 px-5 py-4">{purchaseItems.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-content-primary">{item.nome} · {item.quantidade} {item.unidade}</span><span className="text-content-secondary">{item.preco_real === null ? 'Sem preço' : `${money.format(item.preco_real)} / ${item.unidade}`} {item.preco_real !== null ? `· ${money.format(item.preco_real * item.quantidade)}` : ''}</span></div>)}</div></details>; })}</div>}</section> : <>
      {podeEscrever ? <>
        <section className="card p-5"><div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-brand-400" /><h2 className="font-display text-h3">{editing ? 'Editar item' : 'Adicionar item à lista'}</h2></div><form onSubmit={(event) => void (editing ? handleEdit(event) : handleCreate(event))} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.65fr_0.7fr_0.8fr_1.1fr_auto] lg:items-end">
          <label><span className="label-base">Produto</span><input required value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} className="input-base" placeholder="Ex.: Arroz" /></label><label><span className="label-base">Quantidade</span><input required type="number" min="0.01" step="0.01" value={form.quantidade} onChange={(event) => setForm((current) => ({ ...current, quantidade: event.target.value }))} className="input-base" /></label><label><span className="label-base">Unidade</span><select value={form.unidade} onChange={(event) => setForm((current) => ({ ...current, unidade: event.target.value }))} className="input-base">{['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa'].map((unit) => <option key={unit}>{unit}</option>)}</select></label><label><span className="label-base">Preço unitário (R$)</span><input type="number" min="0" step="0.01" value={form.preco_referencia} onChange={(event) => setForm((current) => ({ ...current, preco_referencia: event.target.value }))} className="input-base" placeholder="Opcional" /></label><label><span className="label-base">Observação</span><input value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} className="input-base" placeholder="Opcional" /></label><div className="flex gap-2"><button type="submit" disabled={isCreating} className="btn-primary flex flex-1 items-center justify-center gap-2"><Plus className="h-4 w-4" />{editing ? 'Salvar' : 'Adicionar'}</button>{editing ? <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="btn-secondary">Cancelar</button> : null}</div>
        </form></section>

        <section className="card p-4"><div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 text-sm font-semibold text-ink-900"><ClipboardList className="h-4 w-4 text-brand-600" />Listas fixas</div>{listasFixas.length ? <><select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} className="input-base min-w-52 flex-1"><option value="">Escolha uma lista para reaproveitar</option>{listasFixas.map((list) => <option key={list.id} value={list.id}>{list.nome} · {list.itens?.length ?? 0} itens</option>)}</select><button disabled={!selectedTemplate} type="button" onClick={() => void handleApplyTemplate()} className="btn-secondary disabled:opacity-50">Adicionar à lista</button></> : <span className="text-xs text-ink-500">Salve um modelo para usar em outras compras.</span>}<form onSubmit={(event) => void handleSaveTemplate(event)} className="flex min-w-64 flex-1 gap-2"><input required value={templateName} onChange={(event) => setTemplateName(event.target.value)} className="input-base" placeholder="Nome da lista atual" /><button type="submit" disabled={!itens.length} className="btn-secondary flex shrink-0 items-center gap-2 disabled:opacity-50"><Archive className="h-4 w-4" />Salvar como fixa</button></form></div>{listasFixas.length ? <div className="mt-3 flex flex-wrap gap-2">{listasFixas.map((list) => <button key={list.id} type="button" onClick={() => setConfirmDeleteTemplate(list)} className="text-xs text-ink-500 underline decoration-canvas-400 underline-offset-2 hover:text-state-error" aria-label={`Excluir lista fixa ${list.nome}`}>Remover “{list.nome}”</button>)}</div> : null}</section>
      </> : <div className="rounded-xl border border-navy-600 bg-navy-900 p-4 text-sm text-content-secondary">Seu acesso a esta lista é somente para visualizar.</div>}

      <section className="overflow-hidden rounded-xl border border-navy-600 bg-navy-900"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-600 p-5"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-400"><ShoppingCart className="h-4 w-4" />Lista reutilizável</div><p className="mt-2 font-display text-2xl font-semibold text-content-primary">{pending} a comprar <span className="text-content-secondary">· {bought} comprados</span></p></div><div className="flex flex-wrap items-end gap-3"><label><span className="label-base">Data da compra</span><input type="date" value={compraData} onChange={(event) => setCompraData(event.target.value)} className="input-base" /></label><div className="text-right"><p className="text-xs text-content-secondary">Total da lista</p><p className="font-display text-xl font-semibold text-state-success">{money.format(total)}</p></div><button disabled={!podeEscrever || !bought} type="button" onClick={() => void handleSaveHistory()} className="btn-primary disabled:opacity-50">Registrar compra</button></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-600 px-4 py-3"><div className="flex gap-1 rounded-lg border border-navy-600 bg-navy-900 p-1">{([['todos', `Todos (${itens.length})`], ['pendente', `A comprar (${pending})`], ['comprado', `Comprados (${bought})`]] as Array<['todos' | ListaMercadoStatus, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${filter === value ? 'bg-brand-600 text-white' : 'text-content-secondary hover:text-content-primary'}`}>{label}</button>)}</div><p className="text-xs text-content-secondary">Marque os itens e ajuste os preços durante as compras.</p></div>
        {isLoading ? <p className="p-8 text-center text-sm text-content-secondary">Carregando lista...</p> : visibleItems.length === 0 ? <div className="p-5"><EmptyState title="Sua lista está vazia" description="Adicione um produto ou aplique uma lista fixa salva." /></div> : <div className="divide-y divide-navy-600">{visibleItems.map((item) => <div key={item.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 ${item.status === 'comprado' ? 'opacity-70' : ''}`}><button disabled={!podeEscrever} type="button" onClick={() => void handleToggle(item)} className="shrink-0 text-brand-400 disabled:cursor-default" aria-label={item.status === 'comprado' ? `Marcar ${item.nome} como não comprado` : `Marcar ${item.nome} como comprado`}>{item.status === 'comprado' ? <Check className="h-5 w-5 rounded-full bg-state-success p-0.5 text-navy-900" /> : <Circle className="h-5 w-5" />}</button><div className="min-w-36 flex-1"><p className={`font-medium text-content-primary ${item.status === 'comprado' ? 'line-through' : ''}`}>{item.nome}</p>{item.observacao ? <p className="text-xs text-content-secondary">{item.observacao}</p> : null}{item.data_compra ? <p className="mt-1 text-[11px] text-content-secondary">Comprado em {dateLabel(item.data_compra)}</p> : null}</div><span className="text-sm text-content-secondary">{item.quantidade} {item.unidade}</span><div className="flex w-44 items-end gap-2"><label className="min-w-28 flex-1"><span className="label-base">Preço / {item.unidade}</span><div className="flex items-center gap-1"><span className="text-xs text-content-secondary">R$</span><input type="number" min="0" step="0.01" disabled={!podeEscrever} defaultValue={item.preco_real ?? item.preco_referencia ?? ''} key={`${item.id}-${item.preco_real ?? item.preco_referencia ?? ''}`} onBlur={(event) => { const value = event.target.value; if (value !== '' && Number(value) !== item.preco_real) void (async () => { try { await atualizarPrecoReal({ id: item.id, price: Number(value) }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível atualizar o preço.'); } })(); }} className="input-base py-2" placeholder="0,00" /></div></label><button type="button" disabled={!podeEscrever} onClick={() => { setEditing(item); setForm({ nome: item.nome, quantidade: item.quantidade ?? '1', observacao: item.observacao ?? '', unidade: item.unidade, preco_referencia: item.preco_referencia?.toString() ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="icon-button text-brand-400" aria-label={`Editar ${item.nome}`}><Pencil className="h-4 w-4" /></button><button type="button" disabled={!podeEscrever} onClick={() => setConfirmDeleteItem(item)} className="icon-button text-state-error" aria-label={`Remover ${item.nome}`}><Trash2 className="h-4 w-4" /></button></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.status === 'comprado' ? 'bg-state-success/10 text-state-success' : 'bg-brand-600/10 text-brand-400'}`}>{item.status === 'comprado' ? 'Comprado' : 'A comprar'}</span></div>)}</div>}
      </section>
      </>}
      <ConfirmDialog open={Boolean(confirmDeleteItem)} title="Remover item" description={confirmDeleteItem ? `Remover "${confirmDeleteItem.nome}" da lista atual?` : ''} confirmLabel="Remover" cancelLabel="Cancelar" onConfirm={() => void handleDeleteItem()} onCancel={() => setConfirmDeleteItem(null)} danger />
      <ConfirmDialog open={Boolean(confirmDeleteCompra)} title="Excluir do histórico" description={confirmDeleteCompra ? `Excluir permanentemente a compra de ${dateLabel(confirmDeleteCompra.data_compra)}?` : ''} confirmLabel="Excluir compra" cancelLabel="Cancelar" onConfirm={() => void handleDeleteCompra()} onCancel={() => setConfirmDeleteCompra(null)} danger />
      <ConfirmDialog open={Boolean(confirmDeleteTemplate)} title="Excluir lista fixa" description={confirmDeleteTemplate ? `Excluir o modelo "${confirmDeleteTemplate.nome}"? Itens já adicionados à lista atual permanecem.` : ''} confirmLabel="Excluir lista" cancelLabel="Cancelar" onConfirm={() => void handleDeleteTemplate()} onCancel={() => setConfirmDeleteTemplate(null)} danger />
    </div>;
}
