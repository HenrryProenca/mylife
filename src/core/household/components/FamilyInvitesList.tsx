import { Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConvites } from '../hooks/useConvites';
import { convitePapelLabels, montarLinkConvite } from '../convites.service';

export function FamilyInvitesList({ householdId }: { householdId: string }) {
  const { convites, isLoading, cancelarConvite, isCancelling } = useConvites(householdId);

  async function handleCopy(token: string) {
    const link = montarLinkConvite(token);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência.');
    } catch {
      window.prompt('Copie o link abaixo:', link);
    }
  }

  async function handleCancel(conviteId: string) {
    try {
      await cancelarConvite(conviteId);
      toast.success('Convite cancelado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível cancelar o convite.');
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
        Carregando convites...
      </div>
    );
  }

  if (convites.length === 0) {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
        Nenhum convite pendente.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {convites.map((convite) => (
        <div
          key={convite.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-canvas-300 bg-white px-3 py-2.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-200 text-ink-500">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink-900">
                {convite.email_convidado}
              </div>
              <div className="text-xs text-ink-500">
                {convitePapelLabels[convite.papel]} · aguardando aceite
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => void handleCopy(convite.token)}
              className="btn-ghost text-xs"
            >
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => void handleCancel(convite.id)}
              disabled={isCancelling}
              className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10"
              aria-label={`Cancelar convite para ${convite.email_convidado}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
