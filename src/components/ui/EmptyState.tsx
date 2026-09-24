import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/10 text-brand-400">
        <span className="text-2xl">•</span>
      </div>

      <div>
        <h3 className="font-display text-h3 text-content-primary">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-content-secondary">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
