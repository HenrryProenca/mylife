import { Check, Circle, Trash2 } from 'lucide-react';
import type { ListaMercadoItem } from '../types/listaMercado.types';

interface ListaMercadoItemRowProps {
  item: ListaMercadoItem;
  onToggle: () => void;
  onDelete: () => void;
}

export function ListaMercadoItemRow({ item, onToggle, onDelete }: ListaMercadoItemRowProps) {
  const comprado = item.status === 'comprado';

  return (
    <div className={`flex items-center gap-3 border-b border-navy-600 px-4 py-3 last:border-b-0 ${comprado ? 'opacity-60' : ''}`}>
      <button type="button" onClick={onToggle} className="shrink-0 text-brand-400" aria-label={comprado ? `Marcar ${item.nome} como pendente` : `Marcar ${item.nome} como comprado`}>
        {comprado ? <Check className="h-5 w-5 rounded-full bg-state-success p-0.5 text-navy-900" /> : <Circle className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-content-primary ${comprado ? 'line-through' : ''}`}>{item.nome}</p>
        {item.observacao || item.quantidade ? <p className="mt-0.5 text-xs text-content-secondary">{item.quantidade ? `${item.quantidade}${item.observacao ? ' · ' : ''}` : ''}{item.observacao ?? ''}</p> : null}
      </div>
      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${comprado ? 'bg-state-success/10 text-state-success' : 'bg-brand-600/10 text-brand-400'}`}>{comprado ? 'Comprado' : 'A comprar'}</span>
      <button type="button" onClick={onDelete} className="icon-button text-state-error" aria-label={`Excluir ${item.nome}`}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
