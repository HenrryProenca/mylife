#!/usr/bin/env bash

# ============================================================
# Tarefa: Migrar paleta dos 4 componentes de UI
# ============================================================
# O que este script faz:
# - Modal.tsx: fundo branco, textos ink, botões canvas
# - ConfirmDialog.tsx: remove duplicação do description + paleta
# - EmptyState.tsx: bullet → ícone Lucide + paleta
# - Badge.tsx: red-500/yellow-500 → state-error/state-alert
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - src/components/ui/Modal.tsx (sobrescrito)
#   - src/components/ui/ConfirmDialog.tsx (sobrescrito)
#   - src/components/ui/EmptyState.tsx (sobrescrito)
#   - src/components/ui/Badge.tsx (sobrescrito)
# ============================================================

set -e

# --- src/components/ui/Modal.tsx ---
cat << 'EOF' > src/components/ui/Modal.tsx
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-canvas-300 bg-white shadow-card-lg`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-canvas-300 px-5 py-4">
          <div>
            <h2 id="modal-title" className="font-display text-h3 text-ink-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-ink-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-canvas-200 hover:text-ink-900"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer ? <div className="border-t border-canvas-300 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
EOF

# --- src/components/ui/ConfirmDialog.tsx ---
cat << 'EOF' > src/components/ui/ConfirmDialog.tsx
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-canvas-300 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-canvas-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
              danger
                ? 'bg-state-error hover:brightness-105'
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-sm text-ink-500">{description}</div>
    </Modal>
  );
}
EOF

# --- src/components/ui/EmptyState.tsx ---
cat << 'EOF' > src/components/ui/EmptyState.tsx
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
        <Inbox className="h-6 w-6" />
      </div>

      <div>
        <h3 className="font-display text-h3 text-ink-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-ink-500">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
EOF

# --- src/components/ui/Badge.tsx ---
cat << 'EOF' > src/components/ui/Badge.tsx
import type { ReactNode } from 'react';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'neutral' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const classesByVariant: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-state-success/15 text-state-success border-state-success/30',
  warning: 'bg-state-alert/15 text-state-alert border-state-alert/30',
  neutral: 'bg-canvas-200 text-ink-500 border-canvas-300',
  danger: 'bg-state-error/15 text-state-error border-state-error/30',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classesByVariant[variant]}`}
    >
      {children}
    </span>
  );
}
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git diff"
echo "  2. Se estiver OK: git add . && git commit -m \"style: migra paleta dos componentes de UI\" && git push"
echo ""
