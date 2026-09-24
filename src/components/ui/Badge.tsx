type BadgeVariant = 'brand' | 'success' | 'warning' | 'neutral' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const classesByVariant: Record<BadgeVariant, string> = {
  brand: 'bg-brand-600/15 text-brand-300 border-brand-500/30',
  success: 'bg-state-success/15 text-state-success border-state-success/30',
  warning: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
  neutral: 'bg-white/5 text-content-secondary border-white/10',
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
