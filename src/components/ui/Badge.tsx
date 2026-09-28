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
