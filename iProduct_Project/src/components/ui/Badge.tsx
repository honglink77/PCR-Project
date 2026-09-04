import { cn } from '@/utils/cn';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-surface-100 text-surface-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
};

const dotColors = {
  default: 'bg-surface-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
};

export function Badge({ label, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {label}
    </span>
  );
}
