import { useMemo, useState } from 'react';
import { Check, Home, Pencil, PiggyBank, Plus, ShoppingBag, Tag, Trash2, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCategorias } from '../hooks/useCategorias';
import type { Categoria, CategoriaNatureza } from '../types/categorias.types';

const tabs: Array<{ id: 'receita' | CategoriaNatureza | 'cartao'; label: string; icon: typeof Tag }> = [
  { id: 'receita', label: 'Receitas', icon: TrendingUp },
  { id: 'fixo', label: 'Fixo', icon: Home },
  { id: 'variavel', label: 'Variável', icon: ShoppingBag },
  { id: 'cartao', label: 'Cartão', icon: Tag },
  { id: 'investimento', label: 'Investimento', icon: PiggyBank },
];

type CategoryTab = typeof tabs[number]['id'];

function categoryNature(tab: CategoryTab): CategoriaNatureza {
  return tab === 'receita' ? 'outro' : tab === 'cartao' ? 'variavel' : tab;
}

export function CategoriasManager() {
  const { categorias, isLoading, createCategoria, updateCategoria, deleteCategoria, isCreating, isUpdating, isDeleting } = useCategorias();
  const [activeTab, setActiveTab] = useState<CategoryTab>('receita');
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleting, setDeleting] = useState<Categoria | null>(null);

  const visible = useMemo(() => categorias.filter((categoria) => (
    activeTab === 'receita'
      ? categoria.tipo === 'receita'
      : categoria.tipo === 'despesa' && categoria.natureza === categoryNature(activeTab)
  )), [activeTab, categorias]);

  async function addCategory() {
    const nome = newName.trim();
    if (!nome) return;
    try {
      await createCategoria({ nome, tipo: activeTab === 'receita' ? 'receita' : 'despesa', natureza: categoryNature(activeTab), cor: '', icone: '', ativa: true });
      setNewName('');
      toast.success('Categoria adicionada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível adicionar a categoria.');
    }
  }

  async function saveEdit() {
    if (!editing || !editingName.trim()) return;
    try {
      await updateCategoria({ categoriaId: editing.id, values: { nome: editingName.trim(), tipo: editing.tipo, natureza: editing.natureza, cor: editing.cor ?? '', icone: editing.icone ?? '', ativa: editing.ativa } });
      setEditing(null);
      toast.success('Categoria renomeada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível renomear a categoria.');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteCategoria(deleting.id);
      toast.success('Categoria excluída.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a categoria.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-h3 text-ink-900">Gerenciar categorias</h2>
        <p className="mt-1 text-xs text-ink-500">Adicione, renomeie ou exclua categorias usadas no dashboard.</p>
      </div>
      <div className="flex flex-wrap gap-1 rounded-lg border border-canvas-300 bg-canvas-100 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActiveTab(id); setEditing(null); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
              activeTab === id
                ? 'bg-brand-600 text-white'
                : 'text-ink-500 hover:bg-canvas-200 hover:text-ink-900'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addCategory(); } }}
          className="input-base"
          placeholder="Nova categoria..."
        />
        <button
          type="button"
          onClick={() => void addCategory()}
          disabled={isCreating || !newName.trim()}
          className="btn-primary flex shrink-0 items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-ink-500">Carregando categorias...</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-500">Nenhuma categoria. Adicione a primeira acima.</p>
        ) : visible.map((categoria) => (
          <div
            key={categoria.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-canvas-300 bg-white px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              {editing?.id === categoria.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void saveEdit(); if (event.key === 'Escape') setEditing(null); }}
                  className="input-base py-1.5 text-sm"
                />
              ) : (
                <span className="text-sm text-ink-900">{categoria.nome}</span>
              )}
            </div>
            <div className="flex gap-1">
              {editing?.id === categoria.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    disabled={isUpdating}
                    className="icon-button text-state-success hover:border-state-success/30 hover:bg-state-success/10"
                    aria-label="Salvar categoria"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="icon-button"
                    aria-label="Cancelar edição"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setEditing(categoria); setEditingName(categoria.nome); }}
                    className="icon-button"
                    aria-label={`Renomear ${categoria.nome}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(categoria)}
                    className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10"
                    aria-label={`Excluir ${categoria.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir categoria"
        description={deleting ? `Tem certeza que deseja excluir "${deleting.nome}"?` : 'Tem certeza que deseja excluir esta categoria?'}
        confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir'}
        cancelLabel="Cancelar"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
        danger
      />
    </div>
  );
}
