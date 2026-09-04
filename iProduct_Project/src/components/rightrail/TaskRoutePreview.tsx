import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { taskItems } from '@/data/workspace';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export function TaskRoutePreview({ entityId }: { entityId: string | null }) {
  const allTasks = [...taskItems];
  const item = allTasks.find((t) => t.id === entityId);

  if (!item) {
    return <div className="p-6 text-sm text-surface-400 text-center">Select a task to view its route.</div>;
  }

  const statusVariant = { pending: 'default', in_progress: 'info', completed: 'success', blocked: 'error' } as const;
  const priorityVariant = { low: 'default', medium: 'warning', high: 'error', critical: 'error' } as const;

  const currentStep = item.status === 'completed' ? item.route.length - 1
    : item.status === 'blocked' ? Math.max(0, Math.floor(item.route.length / 2))
    : Math.floor(item.route.length * 0.3);

  return (
    <div className="p-6">
      <h3 className="text-base font-semibold text-surface-800 mb-2">{item.title}</h3>
      <div className="flex items-center gap-2 mb-6">
        <Badge label={item.status.replace('_', ' ')} variant={statusVariant[item.status]} />
        <Badge label={item.priority} variant={priorityVariant[item.priority]} />
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-surface-500 mb-1">
          <span>Agent</span>
          <span className="font-medium text-surface-700">{item.assignedAgent}</span>
        </div>
        {item.dueAt && (
          <div className="flex justify-between text-xs text-surface-500">
            <span>Due</span>
            <span className="font-medium text-surface-700">{new Date(item.dueAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Route visualization */}
      <div className="bg-surface-50 border border-surface-200 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Route Steps</h4>
        <div className="space-y-0">
          {item.route.map((step, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;
            const isBlocked = item.status === 'blocked' && isCurrent;
            const isLast = i === item.route.length - 1;

            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : isBlocked ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 text-sky-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-surface-300 flex-shrink-0" />
                  )}
                  {!isLast && (
                    <div className={cn(
                      'w-0.5 h-6 my-1',
                      isCompleted ? 'bg-emerald-300' : 'bg-surface-200',
                    )} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={cn(
                    'text-sm font-medium',
                    isCompleted ? 'text-surface-500' : isCurrent ? 'text-surface-800' : 'text-surface-400',
                  )}>{step}</p>
                  {isCurrent && !isBlocked && <span className="text-[11px] text-sky-600">In progress</span>}
                  {isBlocked && <span className="text-[11px] text-red-600">Blocked</span>}
                  {isCompleted && <span className="text-[11px] text-emerald-600">Completed</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
