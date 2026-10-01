import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCategorias } from '../hooks/useCategorias';
import { useContas } from '../hooks/useContas';
import { useResponsaveis } from '../hooks/useResponsaveis';
import { useAuth } from '@/core/auth/useAuth';
import { useHousehold } from '@/core/household/useHousehold';
import type { LancamentoTipo, TransacaoFormValues } from '../types/transacoes.types';

const schema = z.object({
  tipo: z.enum(['receita', 'despesa', 'investimento']),
  natureza: z.enum(['fixo', 'variavel']),
  valor: z.coerce.number().positive('Informe um valor maior que zero.'),
  data: z.string().min(1, 'Informe a data.'),
  descricao: z.string(),
  observacao: z.string(),
  categoria_id: z.string(),
  conta_id: z.string(),
  responsavel_id: z.string(),
  forma_pagamento: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'transferencia', 'outro']),
  status: z.enum(['pendente', 'concluida']),
  parcela_atual: z.number().nullable(),
  parcela_total: z.number().nullable(),
  tipo_no_cartao: z.enum(['avista', 'parcelado']).nullable(),
}).superRefine((values, context) => {
  if (values.tipo !== 'receita' && !values.categoria_id) {
    context.addIssue({ code: 'custom', path: ['categoria_id'], message: 'Selecione uma categoria para definir a natureza.' });
  }
  if (!values.responsavel_id) {
    context.addIssue({ code: 'custom', path: ['responsavel_id'], message: 'Selecione um membro responsável.' });
  }
  if (values.forma_pagamento === 'cartao_credito' && values.tipo_no_cartao === 'parcelado' && (!values.parcela_total || values.parcela_total < 2)) {
    context.addIssue({ code: 'custom', path: ['parcela_total'], message: 'Informe pelo menos 2 parcelas.' });
  }
});

const emptyValues: TransacaoFormValues = {
  tipo: 'receita', natureza: 'variavel', valor: 0, data: new Date().toISOString().slice(0, 10), descricao: '', observacao: '',
  categoria_id: '', conta_id: '', responsavel_id: '', forma_pagamento: 'transferencia', status: 'concluida', parcela_atual: null, parcela_total: null, tipo_no_cartao: 'avista',
};

interface LancamentoFormProps {
  initialValues?: Partial<TransacaoFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: TransacaoFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const tipoLabels: Record<LancamentoTipo, string> = {
  receita: 'Receita', despesa: 'Despesa', investimento: 'Investimento',
};

export function LancamentoForm({ initialValues, isSubmitting = false, onSubmit, onCancel }: LancamentoFormProps) {
  const { categorias } = useCategorias();
  const { contas } = useContas();
  const { responsaveis, isLoading: isLoadingResponsaveis } = useResponsaveis();
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<TransacaoFormValues>({ defaultValues: { ...emptyValues, ...initialValues } });
  const tipo = watch('tipo');
  const categoriaId = watch('categoria_id');
  const parcelaTotal = watch('parcela_total');
  const naturezaSelecionada = watch('natureza');
  const formaPagamento = watch('forma_pagamento');
  const tipoNoCartao = watch('tipo_no_cartao');
  const categoriaTipo = tipo === 'receita' ? 'receita' : 'despesa';
  const categoriaNatureza = tipo === 'investimento' ? 'investimento' : tipo === 'despesa' ? naturezaSelecionada : null;
  const categoriasDoTipo = categorias.filter((categoria) => categoria.tipo === categoriaTipo && categoria.ativa && (!categoriaNatureza || categoria.natureza === categoriaNatureza));
  const espacoPessoal = activeHousehold?.nome.endsWith('(pessoal)') ?? false;
  const responsavelPessoalId = responsaveis.find((responsavel) => responsavel.user_id === user?.id)?.id;

  useEffect(() => {
    reset({ ...emptyValues, ...initialValues });
  }, [initialValues, reset]);

  useEffect(() => {
    if (!espacoPessoal || !user) return;
    const responsavelPessoal = responsaveis.find((responsavel) => responsavel.user_id === user.id);
    if (responsavelPessoal) setValue('responsavel_id', responsavelPessoal.id);
  }, [espacoPessoal, responsaveis, setValue, user]);

  useEffect(() => {
    if (!categoriasDoTipo.some((categoria) => categoria.id === categoriaId)) {
      const categoria = categoriasDoTipo[0];
      if (categoria) reset({ ...watch(), categoria_id: categoria.id });
    }
  }, [categoriasDoTipo, categoriaId, reset, watch]);

  const submit = async (values: TransacaoFormValues) => {
    const parsed = schema.safeParse({
      ...values,
      responsavel_id: espacoPessoal ? responsavelPessoalId ?? '' : values.responsavel_id,
      parcela_atual: values.forma_pagamento === 'cartao_credito' && values.tipo_no_cartao === 'parcelado' && values.parcela_total ? values.parcela_atual ?? 1 : null,
      parcela_total: values.forma_pagamento === 'cartao_credito' && values.tipo_no_cartao === 'parcelado' && values.parcela_total ? values.parcela_total : null,
      tipo_no_cartao: values.forma_pagamento === 'cartao_credito' ? values.tipo_no_cartao ?? 'avista' : null,
    });
    if (parsed.success) await onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Field label="Data"><input type="date" {...register('data')} className="input-base" /></Field>
        <Field label="Tipo"><select {...register('tipo')} className="input-base">{Object.entries(tipoLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        {tipo === 'despesa' ? <Field label="Natureza"><select {...register('natureza')} className="input-base"><option value="fixo">Fixa</option><option value="variavel">Variável</option></select></Field> : null}
        <Field label="Categoria"><select {...register('categoria_id')} className="input-base"><option value="">{tipo === 'receita' ? 'Sem categoria' : 'Selecione uma categoria'}</option>{categoriasDoTipo.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select>{errors.categoria_id ? <ErrorText>{errors.categoria_id.message}</ErrorText> : null}</Field>
        <Field label="Forma de pagamento"><select {...register('forma_pagamento')} className="input-base"><option value="pix">Pix</option><option value="cartao_credito">Cartão de crédito</option><option value="cartao_debito">Cartão de débito</option><option value="boleto">Boleto</option><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="outro">Outro</option></select></Field>
        <Field label="Instituição"><select {...register('conta_id')} className="input-base"><option value="">Sem instituição</option>{contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.instituicao ? `${conta.instituicao} · ${conta.nome}` : conta.nome}</option>)}</select></Field>
        <Field label="Descrição"><input {...register('descricao')} className="input-base" placeholder="Ex: Aluguel de setembro" /></Field>
        <Field label="Valor (R$)"><input type="number" min="0" step="0.01" {...register('valor', { valueAsNumber: true })} className="input-base" placeholder="0,00" />{errors.valor ? <ErrorText>{errors.valor.message}</ErrorText> : null}</Field>
        <div className="flex items-end"><button type="submit" disabled={isSubmitting || isLoadingResponsaveis || (espacoPessoal && !responsavelPessoalId)} className="btn-primary flex w-full items-center justify-center">{isSubmitting ? '...' : 'Lançar'}</button></div>
      </div>

      {formaPagamento === 'cartao_credito' ? <div className="grid gap-3 sm:grid-cols-3"><Field label="Compra no cartão"><select {...register('tipo_no_cartao')} className="input-base"><option value="avista">À vista</option><option value="parcelado">Parcelado</option></select></Field>{tipoNoCartao === 'parcelado' ? <><Field label="Parcela atual"><input type="number" min="1" {...register('parcela_atual', { setValueAs: (value) => value === '' ? null : Number(value) })} className="input-base" placeholder="1" /></Field><Field label="Total de parcelas"><input type="number" min="2" {...register('parcela_total', { setValueAs: (value) => value === '' ? null : Number(value) })} className="input-base" placeholder="10" />{errors.parcela_total ? <ErrorText>{errors.parcela_total.message}</ErrorText> : null}</Field></> : null}</div> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Responsável">
          <select {...register('responsavel_id')} disabled={espacoPessoal} className="input-base">
            {!espacoPessoal ? <option value="">Selecione um membro</option> : null}
            {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          {errors.responsavel_id ? <ErrorText>{errors.responsavel_id.message}</ErrorText> : null}
          {espacoPessoal && !responsavelPessoalId && isLoadingResponsaveis ? <span className="mt-1 block text-xs text-ink-500">Carregando seu perfil...</span> : null}
        </Field>
        <Field label="Status"><select {...register('status')} className="input-base"><option value="concluida">Concluído</option><option value="pendente">Pendente</option></select></Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-ink-500">{tipoNoCartao === 'parcelado' && parcelaTotal && parcelaTotal > 1 ? `Serão criadas ${parcelaTotal} parcelas mensais.` : 'Registre receitas, despesas ou investimentos.'}</p><div className="flex gap-3">{onCancel ? <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button> : null}<button type="button" className="btn-ghost" onClick={() => reset({ ...emptyValues, ...initialValues })}>Limpar</button></div></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="label-base">{label}</span>{children}</label>;
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  return <span className="mt-1 block text-xs text-state-error">{children}</span>;
}
