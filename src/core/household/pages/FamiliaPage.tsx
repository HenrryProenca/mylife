import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHousehold } from '@/core/household/useHousehold';
import { useMembros } from '@/core/household/hooks/useMembros';
import { FamilyInviteForm } from '../components/FamilyInviteForm';
import { FamilyInvitesList } from '../components/FamilyInvitesList';
import { FamilyMembersList } from '../components/FamilyMembersList';

export default function FamiliaPage() {
  const { activeHousehold, households } = useHousehold();
  const { membros, isLoading: carregandoMembros } = useMembros();

  if (!activeHousehold) {
    const temFamilias = households.length > 0;

    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Família</h1>
        <div className="mt-6">
          <EmptyState
            title={temFamilias ? 'Selecione uma família' : 'Nenhuma família cadastrada'}
            description={
              temFamilias
                ? 'Escolha qual família você quer gerenciar.'
                : 'Para convidar membros, crie uma família primeiro.'
            }
            action={
              <Link to={temFamilias ? '/selecionar-familia' : '/onboarding'} className="btn-primary">
                {temFamilias ? 'Selecionar família' : 'Criar família'}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const papelAtual = activeHousehold.membership.papel;
  const podeConvidar = papelAtual === 'owner' || papelAtual === 'admin';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-h2 font-semibold text-ink-900">
            {activeHousehold.nome}
          </h1>
          <p className="text-xs text-ink-500">Gerencie os membros da sua família</p>
        </div>
      </header>

      {podeConvidar ? (
        <section className="card p-5">
          <h2 className="font-display text-h3 text-ink-900">Convidar membro</h2>
          <p className="mt-1 mb-4 text-xs text-ink-500">
            O convite é criado com um link. Envie o link para a pessoa entrar na família.
          </p>
          <FamilyInviteForm />
        </section>
      ) : (
        <section className="rounded-lg border border-canvas-300 bg-canvas-100 p-4 text-sm text-ink-500">
          Apenas dono e administradores podem convidar novos membros.
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-display text-h3 text-ink-900">
          Membros ativos
          {!carregandoMembros && membros.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-ink-500">({membros.length})</span>
          ) : null}
        </h2>
        <p className="mt-1 mb-4 text-xs text-ink-500">
          Pessoas que já aceitaram o convite e fazem parte desta família.
        </p>
        <FamilyMembersList membros={membros} isLoading={carregandoMembros} />
      </section>

      <section className="card p-5">
        <h2 className="font-display text-h3 text-ink-900">Convites pendentes</h2>
        <p className="mt-1 mb-4 text-xs text-ink-500">
          Convites criados que ainda não foram aceitos.
        </p>
        <FamilyInvitesList />
      </section>
    </div>
  );
}
