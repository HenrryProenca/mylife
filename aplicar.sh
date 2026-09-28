#!/usr/bin/env bash

# ============================================================
# Tarefa: Migrar paleta de CategoriasManager e LancamentoForm (5b)
# ============================================================
# O que este script faz:
# - CategoriasManager.tsx: abas e lista na paleta oficial
# - LancamentoForm.tsx: textos no rodapé na paleta oficial
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/modules/financeiro/components/CategoriasManager.tsx (sobrescrito)
#   - src/modules/financeiro/components/LancamentoForm.tsx (sobrescrito)
# ============================================================

set -e

# --- src/modules/financeiro/components/CategoriasManager.tsx ---
cat << 'EOF' > src/modules/financeiro/components/CategoriasManager.tsx
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
EOF

# --- src/modules/financeiro/components/LancamentoForm.tsx ---
cat << 'EOF' > src/modules/financeiro/components/LancamentoForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCategorias } from '../hooks/useCategorias';
import { useContas } from '../hooks/useContas';
import type { LancamentoTipo, TransacaoFormValues } from '../types/transacoes.types';

const schema = z.object({
  tipo: z.enum(['receita', 'fixo', 'variavel', 'cartao', 'investimento']),
  valor: z.coerce.number().positive('Informe um valor maior que zero.'),
  data: z.string().min(1, 'Informe a data.'),
  descricao: z.string(),
  observacao: z.string(),
  categoria_id: z.string(),
  conta_id: z.string(),
  forma_pagamento: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'transferencia', 'outro']),
  status: z.enum(['pendente', 'concluida']),
  parcela_atual: z.number().nullable(),
  parcela_total: z.number().nullable(),
});

const emptyValues: TransacaoFormValues = {
  tipo: 'receita', valor: 0, data: new Date().toISOString().slice(0, 10), descricao: '', observacao: '',
  categoria_id: '', conta_id: '', forma_pagamento: 'transferencia', status: 'concluida', parcela_atual: null, parcela_total: null,
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

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git diff"
echo "  2. Se estiver OK: git add . && git commit -m \"style: migra paleta de CategoriasManager e LancamentoForm\" && git push"
echo ""
