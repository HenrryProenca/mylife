import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHousehold } from '@/core/household/useHousehold';
import { CategoriaForm } from '../components/CategoriaForm';
import { CategoriaList } from '../components/CategoriaList';
import { useCategorias } from '../hooks/useCategorias';
import type { Categoria, CategoriaFormValues, CategoriaTipo } from '../types/categorias.types';
import { Modal } from '@/components/ui/Modal';

const tabs: Array<{ id: CategoriaTipo; label: string }> = [
  { id: 'receita', label: 'Receitas' },
  { id: 'despesa', label: 'Despesas' },
];

function buildDefaultValues(tipo: CategoriaTipo, categoria?: Categoria): CategoriaFormValues {
  return {
    nome: categoria?.nome ?? '',
    tipo: categoria?.tipo ?? tipo,
    natureza: categoria?.natureza ?? 'outro',
    cor: categoria?.cor ?? '',
    icone: categoria?.icone ?? '',
    ativa: categoria?.ativa ?? true,
  };
}

export default function CategoriasPage() {
  const navigate = useNavigate();
  const { activeHousehold, hasHousehold } = useHousehold();
  const {
    categorias,
    isLoading,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategorias();

  const [tipoAtivo, setTipoAtivo] = useState<CategoriaTipo>('despesa');
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEdicao, setCategoriaEdicao] = useState<Categoria | null>(null);
  const [categoriaDelete, setCategoriaDelete] = useState<Categoria | null>(null);

  const categoriasVisiveis = useMemo(
    () => categorias.filter((categoria) => categoria.tipo === tipoAtivo),
    [categorias, tipoAtivo],
  );

  const openCreateModal = () => {
    setCategoriaEdicao(null);
    setModalAberto(true);
  };

  const openEditModal = (categoria: Categoria) => {
    setCategoriaEdicao(categoria);
    setTipoAtivo(categoria.tipo);
    setModalAberto(true);
  };

  const closeModal = () => {
    setCategoriaEdicao(null);
    setModalAberto(false);
  };

  async function handleSubmit(values: CategoriaFormValues) {
    if (!activeHousehold) {
      toast.error('Você precisa selecionar uma família antes de continuar.');
      return;
    }

    try {
      if (categoriaEdicao) {
        await updateCategoria({
          categoriaId: categoriaEdicao.id,
          values,
        });
        toast.success('Categoria atualizada com sucesso.');
      } else {
        await createCategoria(values);
        toast.success('Categoria criada com sucesso.');
      }

      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar a categoria.';
      toast.error(message);
    }
  }

  async function handleDelete(categoria: Categoria) {
    try {
      await deleteCategoria(categoria.id);
      toast.success('Categoria removida com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível excluir a categoria.';
      toast.error(message);
    } finally {
      setCategoriaDelete(null);
    }
  }

  if (!hasHousehold) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-h1 font-semibold tracking-tight">Categorias</h1>
        <div className="mt-6">
          <EmptyState
            title="Nenhuma família cadastrada"
            description="Para criar e organizar categorias, primeiro cadastre ou selecione uma família."
            action={
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
              >
                Criar família
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-h1 font-semibold tracking-tight">Categorias</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Organize as categorias da família {activeHousehold?.nome ?? 'ativa'}.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" />
          Nova categoria
        </button>
      </div>

      <div className="mt-6 flex gap-2 rounded-xl border border-white/10 bg-navy-800/60 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTipoAtivo(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tipoAtivo === tab.id
                ? 'bg-brand-600 text-white'
                : 'text-content-secondary hover:bg-white/5 hover:text-content-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="card p-6 text-sm text-content-secondary">Carregando categorias...</div>
        ) : (
          <CategoriaList
            tipo={tipoAtivo}
            categorias={categorias}
            onEdit={openEditModal}
            onDelete={(categoria) => setCategoriaDelete(categoria)}
            onCreate={openCreateModal}
          />
        )}
      </div>

      {categoriasVisiveis.length === 0 && !isLoading && (
        <div className="mt-6">
          <EmptyState
            title="Nenhuma categoria cadastrada"
            description="Ainda não existem categorias para este tipo. Crie a primeira agora mesmo."
            action={
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
              >
                + Criar categoria
              </button>
            }
          />
        </div>
      )}

      <Modal
        open={modalAberto}
        title={categoriaEdicao ? 'Editar categoria' : 'Nova categoria'}
        description={
          categoriaEdicao
            ? 'Atualize os dados da categoria selecionada.'
            : 'Crie uma categoria para organizar suas receitas ou despesas.'
        }
        onClose={closeModal}
        maxWidth="max-w-2xl"
      >
        <CategoriaForm
          mode={categoriaEdicao ? 'edit' : 'create'}
          initialValues={buildDefaultValues(tipoAtivo, categoriaEdicao ?? undefined)}
          isSubmitting={isCreating || isUpdating}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(categoriaDelete)}
        title="Excluir categoria"
        description={
          categoriaDelete
            ? `Tem certeza que deseja excluir a categoria "${categoriaDelete.nome}"?`
            : 'Tem certeza que deseja excluir esta categoria?'
        }
        confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir'}
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (categoriaDelete) {
            void handleDelete(categoriaDelete);
          }
        }}
        onCancel={() => setCategoriaDelete(null)}
        danger
      />
    </div>
  );
}
