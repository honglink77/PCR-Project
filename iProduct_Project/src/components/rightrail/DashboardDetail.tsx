import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { dashboardItems } from '@/data/workspace';
import { cn } from '@/utils/cn';

export function DashboardDetail({ entityId }: { entityId: string | null }) {
  const item = dashboardItems.find((i) => i.id === entityId);

  if (!item) {
    return <div className="p-6 text-sm text-surface-400 text-center">Select a dashboard metric to view details.</div>;
  }

  const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
  const max = Math.max(...item.chartData);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">{item.category}</p>
        <h3 className="text-lg font-semibold text-surface-800">{item.title}</h3>
      </div>

      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl font-bold text-surface-900">{item.value}</span>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-600' : 'text-surface-500',
        )}>
          <TrendIcon className="w-4 h-4" />
          {item.trend === 'up' ? '+' : ''}{item.trendPercent}%
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 mb-6">
        <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">7-Day Trend</h4>
        <div className="flex items-end gap-2 h-32">
          {item.chartData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end flex-1">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    item.trend === 'up' ? 'bg-emerald-400' : item.trend === 'down' ? 'bg-red-400' : 'bg-brand-400',
                  )}
                  style={{ height: `${(v / max) * 100}%`, minHeight: 4 }}
                />
              </div>
              <span className="text-[10px] text-surface-400">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-surface-100">
          <span className="text-xs text-surface-500">Category</span>
          <span className="text-sm font-medium text-surface-700">{item.category}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-surface-100">
          <span className="text-xs text-surface-500">Trend Direction</span>
          <span className={cn(
            'text-sm font-medium capitalize',
            item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-600' : 'text-surface-600',
          )}>{item.trend}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-xs text-surface-500">Change</span>
          <span className="text-sm font-medium text-surface-700">{item.trendPercent}%</span>
        </div>
      </div>
    </div>
  );
}
