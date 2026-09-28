#!/usr/bin/env bash

# ============================================================
# Tarefa: Migrar paleta dos componentes de categoria (5a)
# ============================================================
# O que este script faz:
# - CategoriaForm.tsx: inputs e textos na paleta oficial
# - CategoriaItem.tsx: cores e botões na paleta oficial
# - CategoriaList.tsx: corrige text-h4 (inexistente) → text-h3
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/modules/financeiro/components/CategoriaForm.tsx (sobrescrito)
#   - src/modules/financeiro/components/CategoriaItem.tsx (sobrescrito)
#   - src/modules/financeiro/components/CategoriaList.tsx (sobrescrito)
# ============================================================

set -e

# --- src/modules/financeiro/components/CategoriaForm.tsx ---
cat << 'EOF' > src/modules/financeiro/components/CategoriaForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CategoriaFormValues } from '../types/categorias.types';

const categoriaFormSchema = z.object({
  nome: z.string().trim().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.').max(60, 'O nome deve ter no máximo 60 caracteres.'),
  tipo: z.enum(['receita', 'despesa']),
  natureza: z.enum(['fixo', 'variavel', 'investimento', 'outro']),
  cor: z.string().optional().default(''),
  icone: z.string().optional().default(''),
  ativa: z.boolean().default(true),
});

export type CategoriaFormProps = {
  mode?: 'create' | 'edit';
  initialValues?: Partial<CategoriaFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: CategoriaFormValues) => Promise<void> | void;
  onCancel: () => void;
};

const defaultValues: CategoriaFormValues = {
  nome: '',
  tipo: 'despesa',
  natureza: 'outro',
  cor: '',
  icone: '',
  ativa: true,
};

export function CategoriaForm({
  mode = 'create',
  initialValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: CategoriaFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoriaFormValues>({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  const selectedTipo = watch('tipo');

  const submit = async (values: CategoriaFormValues) => {
    const parsed = categoriaFormSchema.safeParse(values);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      if (firstError) {
        const fieldName = firstError.path[0] as keyof CategoriaFormValues;
        if (fieldName === 'nome') {
          setValue('nome', values.nome, { shouldValidate: true });
        }
      }
      return;
    }

    await onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="categoria-nome" className="text-sm font-medium text-ink-900">
          Nome
        </label>
        <input
          id="categoria-nome"
          type="text"
          {...register('nome')}
          className="input-base"
          placeholder="Ex: Alimentação"
        />
        {errors.nome ? (
          <p className="text-xs text-state-error">{errors.nome.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="categoria-tipo" className="text-sm font-medium text-ink-900">
            Tipo
          </label>
          <select
            id="categoria-tipo"
            {...register('tipo')}
            className="input-base"
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="categoria-natureza" className="text-sm font-medium text-ink-900">
            Natureza
          </label>
          <select
            id="categoria-natureza"
            {...register('natureza')}
            className="input-base"
          >
            {selectedTipo === 'receita' ? (
              <option value="outro">Outro</option>
            ) : (
              <>
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
                <option value="investimento">Investimento</option>
                <option value="outro">Outro</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="categoria-cor" className="text-sm font-medium text-ink-900">
            Cor
          </label>
          <input
            id="categoria-cor"
            type="text"
            {...register('cor')}
            className="input-base"
            placeholder="#5872C9"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="categoria-icone" className="text-sm font-medium text-ink-900">
            Ícone
          </label>
          <input
            id="categoria-icone"
            type="text"
            {...register('icone')}
            className="input-base"
            placeholder="WalletCards"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-canvas-300 bg-canvas-100 px-3 py-2.5 text-sm text-ink-900">
        <input type="checkbox" {...register('ativa')} className="h-4 w-4 accent-brand-600" />
        Categoria ativa
      </label>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Criar categoria'}
        </button>
      </div>
    </form>
  );
}
EOF

# --- src/modules/financeiro/components/CategoriaItem.tsx ---
cat << 'EOF' > src/modules/financeiro/components/CategoriaItem.tsx
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Categoria } from '../types/categorias.types';

interface CategoriaItemProps {
  categoria: Categoria;
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
}

function formatNatureza(value: Categoria['natureza']) {
  const labels: Record<Categoria['natureza'], string> = {
    fixo: 'Fixo',
    variavel: 'Variável',
    investimento: 'Investimento',
    outro: 'Outro',
  };

  return labels[value];
}

export function CategoriaItem({ categoria, onEdit, onDelete }: CategoriaItemProps) {
  const dotColor = categoria.cor && categoria.cor.trim().length > 0 ? categoria.cor : '#5872C9';

  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold"
          style={{ backgroundColor: `${dotColor}20`, color: dotColor, borderColor: `${dotColor}50` }}
        >
          {categoria.icone && categoria.icone.trim().length > 0 ? categoria.icone.slice(0, 2).toUpperCase() : 'C'}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink-900">{categoria.nome}</span>
            <Badge variant={categoria.tipo === 'receita' ? 'success' : 'brand'}>
              {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {formatNatureza(categoria.natureza)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(categoria)}
          className="icon-button"
          aria-label={`Editar categoria ${categoria.nome}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(categoria)}
          className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10"
          aria-label={`Excluir categoria ${categoria.nome}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
EOF

# --- src/modules/financeiro/components/CategoriaList.tsx ---
cat << 'EOF' > src/modules/financeiro/components/CategoriaList.tsx
import { Coins, Tags, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Categoria, CategoriaTipo, CategoriaNatureza } from '../types/categorias.types';
import { CategoriaItem } from './CategoriaItem';

interface CategoriaListProps {
  tipo: CategoriaTipo;
  categorias: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
  onCreate: () => void;
}

const naturezas: CategoriaNatureza[] = ['fixo', 'variavel', 'investimento', 'outro'];

const naturezaIconMap: Record<CategoriaNatureza, typeof Tags> = {
  fixo: TrendingDown,
  variavel: Coins,
  investimento: TrendingUp,
  outro: Tags,
};

const naturezaLabelMap: Record<CategoriaNatureza, string> = {
  fixo: 'Fixo',
  variavel: 'Variável',
  investimento: 'Investimento',
  outro: 'Outro',
};

export function CategoriaList({
  tipo,
  categorias,
  onEdit,
  onDelete,
  onCreate,
}: CategoriaListProps) {
  const categoriasDoTipo = categorias.filter((categoria) => categoria.tipo === tipo);

  if (categoriasDoTipo.length === 0) {
    return (
      <EmptyState
        title={`Nenhuma categoria de ${tipo === 'receita' ? 'receita' : 'despesa'}`}
        description="Ainda não há categorias cadastradas neste tipo. Crie uma para começar."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="btn-primary"
          >
            + Nova categoria
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {naturezas.map((natureza) => {
        const itens = categoriasDoTipo.filter((categoria) => categoria.natureza === natureza);

        if (itens.length === 0) {
          return null;
        }

        const Icon = naturezaIconMap[natureza];

        return (
          <section key={`${tipo}-${natureza}`} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-600" />
              <h3 className="font-display text-h3 text-ink-900">
                {naturezaLabelMap[natureza]}
              </h3>
              <Badge variant="neutral">{itens.length}</Badge>
            </div>

            <div className="space-y-3">
              {itens.map((categoria) => (
                <CategoriaItem
                  key={categoria.id}
                  categoria={categoria}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git diff"
echo "  2. Se estiver OK: git add . && git commit -m \"style: migra paleta dos componentes de categoria\" && git push"
echo ""
