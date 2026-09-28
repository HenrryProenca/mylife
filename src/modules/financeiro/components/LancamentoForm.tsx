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
