import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface IconButtonProps {
  children: ReactNode;
  label: string;
  className?: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

export function IconButton({ children, label, className, active, badge, onClick }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150',
        'text-surface-500 hover:text-surface-700 hover:bg-surface-100 active:bg-surface-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        active && 'bg-surface-100 text-surface-800',
        className,
      )}
      onClick={onClick}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
