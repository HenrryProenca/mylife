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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-4">
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-white/10 bg-navy-900 shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="modal-title" className="font-display text-h3 text-content-primary">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-content-secondary">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-content-secondary transition hover:bg-white/5 hover:text-content-primary"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer ? <div className="border-t border-white/10 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
