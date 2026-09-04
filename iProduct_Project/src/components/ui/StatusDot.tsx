import { cn } from '@/utils/cn';

interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'neutral' | 'running';
  pulse?: boolean;
  className?: string;
}

const colors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  neutral: 'bg-surface-400',
  running: 'bg-sky-500',
};

export function StatusDot({ status, pulse, className }: StatusDotProps) {
  return (
    <span className={cn('relative flex h-2.5 w-2.5 flex-shrink-0', className)}>
      {pulse && (
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', colors[status])} />
      )}
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', colors[status])} />
    </span>
  );
}
