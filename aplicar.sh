#!/usr/bin/env bash

# ============================================================
# Fix — Recriar FamilyInviteForm e FamilyInvitesList
# ============================================================
# O que este script faz:
# - Recria os dois componentes que faltam em components/
# - Não toca em nenhum outro arquivo
#
# Arquivos criados:
#   - src/core/household/components/FamilyInviteForm.tsx
#   - src/core/household/components/FamilyInvitesList.tsx
#
# Arquivos alterados: nenhum
# ============================================================

set -e

mkdir -p src/core/household/components

# ---------- CRIAR: core/household/components/FamilyInviteForm.tsx ----------
cat << 'EOF' > src/core/household/components/FamilyInviteForm.tsx
import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useConvites } from '../hooks/useConvites';
import type { ConvitePapel } from '../convites.types';

export function FamilyInviteForm() {
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<ConvitePapel>('membro');
  const { criarConvite, isCreating } = useConvites();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !emailLimpo.includes('@')) {
      toast.error('Informe um email válido.');
      return;
    }

    try {
      const convite = await criarConvite({ email_convidado: emailLimpo, papel });
      setEmail('');
      const link = `${window.location.origin}/aceitar-convite?token=${convite.token}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Convite criado. Link copiado — envie para a pessoa.');
      } catch {
        toast.success('Convite criado. Copie o link na lista abaixo.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar o convite.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="label-base">Email do convidado</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="esposa@exemplo.com"
          className="input-base"
          disabled={isCreating}
        />
      </label>

      <label className="sm:w-48">
        <span className="label-base">Papel</span>
        <select
          value={papel}
          onChange={(e) => setPapel(e.target.value as ConvitePapel)}
          className="input-base"
          disabled={isCreating}
        >
          <option value="membro">Membro</option>
          <option value="admin">Administrador</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={isCreating}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        {isCreating ? 'Convidando...' : 'Convidar'}
      </button>
    </form>
  );
}
EOF

# ---------- CRIAR: core/household/components/FamilyInvitesList.tsx ----------
cat << 'EOF' > src/core/household/components/FamilyInvitesList.tsx
import { Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConvites } from '../hooks/useConvites';
import { convitePapelLabels, montarLinkConvite } from '../convites.service';

export function FamilyInvitesList() {
  const { convites, isLoading, cancelarConvite, isCancelling } = useConvites();

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
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. ls src/core/household/components/   (deve mostrar 4 arquivos)"
echo "  2. npm run typecheck                    (confirma que não quebrou tipos)"
echo "  3. npm run dev                          (testa /selecionar-familia)"
echo "  4. Se estiver OK: git add . && git commit -m \"fix: recria componentes de convite\" && git push"
echo ""
