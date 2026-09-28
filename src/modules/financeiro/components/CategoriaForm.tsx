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
