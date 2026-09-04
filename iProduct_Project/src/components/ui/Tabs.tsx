import { cn } from '@/utils/cn';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 border-b border-surface-200', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap',
            activeId === item.id
              ? 'text-brand-600'
              : 'text-surface-500 hover:text-surface-700',
          )}
        >
          <span className="flex items-center gap-2">
            {item.label}
            {item.count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeId === item.id ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-500',
              )}>
                {item.count}
              </span>
            )}
          </span>
          {activeId === item.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
