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
