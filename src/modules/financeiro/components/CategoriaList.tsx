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
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
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
              <Icon className="h-4 w-4 text-brand-400" />
              <h3 className="font-display text-h4 text-content-primary">
                {natureza === 'fixo'
                  ? 'Fixo'
                  : natureza === 'variavel'
                    ? 'Variável'
                    : natureza === 'investimento'
                      ? 'Investimento'
                      : 'Outro'}
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
