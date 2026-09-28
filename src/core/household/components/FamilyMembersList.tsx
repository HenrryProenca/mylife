import { Crown, Shield, Users } from 'lucide-react';
import type { MembroDoHousehold } from '../household.service';
import type { HouseholdRole } from '../types';

interface FamilyMembersListProps {
  membros: MembroDoHousehold[];
  isLoading?: boolean;
}

const papelLabels: Record<HouseholdRole, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  membro: 'Membro',
};

const papelIcons: Record<HouseholdRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  membro: Users,
};

export function FamilyMembersList({ membros, isLoading = false }: FamilyMembersListProps) {
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
          </div>
        );
      })}
    </div>
  );
}
