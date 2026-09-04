import { cn } from '@/utils/cn';

interface AvatarProps {
  name: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export function Avatar({ name, initials, size = 'md', className }: AvatarProps) {
  const fallback = initials || name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      title={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-600 text-white font-semibold select-none flex-shrink-0',
        sizes[size],
        className,
      )}
    >
      {fallback}
    </div>
  );
}
