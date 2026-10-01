import { useState } from 'react';
import { Crown, Eye, Shield, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { MembroDoHousehold } from '../household.service';
import type { HouseholdRole } from '../types';

interface FamilyMembersListProps {
  membros: MembroDoHousehold[];
  isLoading?: boolean;
  podeRemover?: boolean;
  usuarioAtualId: string | null;
  onRemover: (membroId: string) => Promise<void>;
  isRemoving?: boolean;
  onAlterarPapel: (
    membroId: string,
    papel: Exclude<HouseholdRole, 'owner'>,
  ) => Promise<void>;
  isUpdatingRole?: boolean;
}

const papelLabels: Record<HouseholdRole, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  membro: 'Leitura e escrita',
  visualizador: 'Somente visualização',
};

const papelIcons: Record<HouseholdRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  membro: Users,
  visualizador: Eye,
};

export function FamilyMembersList({
  membros,
  isLoading = false,
  podeRemover = false,
  usuarioAtualId,
  onRemover,
  isRemoving = false,
  onAlterarPapel,
  isUpdatingRole = false,
}: FamilyMembersListProps) {
  const [membroSelecionado, setMembroSelecionado] = useState<MembroDoHousehold | null>(null);

  async function handleRemove() {
    if (!membroSelecionado || isRemoving) return;

    try {
      await onRemover(membroSelecionado.id);
      toast.success(`${membroSelecionado.nome} foi removido da família.`);
      setMembroSelecionado(null);
    } catch (error) {
      console.error('[família] erro ao remover membro:', error);
      toast.error('Não foi possível remover este membro. Verifique sua permissão e tente novamente.');
    }
  }

  async function handleRoleChange(membroId: string, papel: Exclude<HouseholdRole, 'owner'>) {
    try {
      await onAlterarPapel(membroId, papel);
      toast.success('Permissão do membro atualizada.');
    } catch (error) {
      console.error('[família] erro ao atualizar permissão:', error);
      toast.error('Não foi possível atualizar esta permissão. Verifique seu acesso e tente novamente.');
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
        Carregando membros...
      </div>
    );
  }

  if (membros.length === 0) {
    return (
      <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
        Nenhum membro cadastrado.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {membros.map((membro) => {
        const Icon = papelIcons[membro.papel] ?? Users;

        return (
          <div
            key={membro.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-canvas-300 bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-semibold overflow-hidden">
                {membro.avatar_url ? (
                  <img
                    src={membro.avatar_url}
                    alt={membro.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  membro.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-900">{membro.nome}</div>
                <div className="flex items-center gap-1 text-xs text-ink-500">
                  <Icon className="h-3 w-3" />
                  {papelLabels[membro.papel]}
                </div>
              </div>
            </div>
            {podeRemover && membro.papel !== 'owner' && membro.user_id !== usuarioAtualId ? (
              <div className="flex items-center gap-2">
                <select
                  value={membro.papel}
                  onChange={(event) =>
                    void handleRoleChange(
                      membro.id,
                      event.target.value as Exclude<HouseholdRole, 'owner'>,
                    )
                  }
                  disabled={isUpdatingRole}
                  className="input-base w-auto py-1.5 text-xs"
                  aria-label={`Permissão de ${membro.nome}`}
                >
                  <option value="admin">Administrador</option>
                  <option value="membro">Leitura e escrita</option>
                  <option value="visualizador">Somente visualização</option>
                </select>
                <button
                  type="button"
                  onClick={() => setMembroSelecionado(membro)}
                  disabled={isRemoving}
                  className="icon-button text-state-error hover:border-state-error/30 hover:bg-state-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remover ${membro.nome} da família`}
                  title={`Remover ${membro.nome}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
      <ConfirmDialog
        open={Boolean(membroSelecionado)}
        title="Remover membro"
        description={
          membroSelecionado
            ? `Tem certeza que deseja remover ${membroSelecionado.nome} desta família? A pessoa perderá acesso aos dados compartilhados.`
            : 'Tem certeza que deseja remover este membro desta família?'
        }
        confirmLabel={isRemoving ? 'Removendo...' : 'Remover'}
        onConfirm={() => void handleRemove()}
        onCancel={() => {
          if (!isRemoving) setMembroSelecionado(null);
        }}
        danger
      />
    </div>
  );
}
