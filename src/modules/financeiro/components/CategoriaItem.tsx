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
