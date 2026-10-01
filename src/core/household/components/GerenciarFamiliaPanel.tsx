import { Users } from 'lucide-react';
import { FamilyInviteForm } from './FamilyInviteForm';
import { FamilyInvitesList } from './FamilyInvitesList';
import { FamilyMembersList } from './FamilyMembersList';
import { useMembros } from '../hooks/useMembros';
import type { HouseholdWithMembership } from '../types';
import { useAuth } from '@/core/auth/useAuth';
import { podeGerenciarHousehold } from '../permissoes';

interface GerenciarFamiliaPanelProps {
  household: HouseholdWithMembership;
}

export function GerenciarFamiliaPanel({ household }: GerenciarFamiliaPanelProps) {
  const { user } = useAuth();
  const {
    membros,
    isLoading: carregandoMembros,
    removerMembro,
    isRemoving,
    alterarPapel,
    isUpdatingRole,
  } = useMembros(household.id);

  const papelAtual = household.membership.papel;
  const espacoPessoal = /\(pessoal\)$/i.test(household.nome);
  const podeGerenciar = !espacoPessoal && podeGerenciarHousehold(papelAtual);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-h3 font-semibold text-ink-900">
            Gerenciar {household.nome}
          </h2>
          <p className="text-xs text-ink-500">
            Membros e convites desta família
          </p>
        </div>
      </header>

      {podeGerenciar ? (
        <section className="rounded-xl border border-canvas-300 bg-white p-4">
          <h3 className="font-display text-h3 text-ink-900">Convidar membro</h3>
          <p className="mt-1 mb-3 text-xs text-ink-500">
            Crie um convite e envie o link para a pessoa entrar na família.
          </p>
          <FamilyInviteForm householdId={household.id} />
        </section>
      ) : (
        <div className="rounded-lg border border-canvas-300 bg-canvas-100 p-3 text-xs text-ink-500">
          {espacoPessoal
            ? 'Este espaço é individual. Para compartilhar dados, crie uma família separada.'
            : 'Apenas dono e administradores podem convidar novos membros.'}
        </div>
      )}

      <section className="rounded-xl border border-canvas-300 bg-white p-4">
        <h3 className="font-display text-h3 text-ink-900">
          Membros ativos
          {!carregandoMembros && membros.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-ink-500">({membros.length})</span>
          ) : null}
        </h3>
        <p className="mt-1 mb-3 text-xs text-ink-500">
          Pessoas que já fazem parte desta família.
        </p>
        <FamilyMembersList
          membros={membros}
          isLoading={carregandoMembros}
          podeRemover={podeGerenciar}
          usuarioAtualId={user?.id ?? null}
          onRemover={removerMembro}
          isRemoving={isRemoving}
          onAlterarPapel={(membroId, papel) => alterarPapel({ membroId, papel })}
          isUpdatingRole={isUpdatingRole}
        />
      </section>

      {podeGerenciar ? (
        <section className="rounded-xl border border-canvas-300 bg-white p-4">
          <h3 className="font-display text-h3 text-ink-900">Convites pendentes</h3>
          <p className="mt-1 mb-3 text-xs text-ink-500">
            Convites criados que ainda não foram aceitos.
          </p>
          <FamilyInvitesList householdId={household.id} />
        </section>
      ) : null}
    </div>
  );
}
