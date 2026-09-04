import { Briefcase, Code2, Palette, Rocket, Settings, BookOpen } from 'lucide-react';
import { useAppDispatch } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { agents } from '@/data/agents';
import { informationItems, dashboardItems, taskItems } from '@/data/workspace';
import { currentUser } from '@/data/users';
import { cn } from '@/utils/cn';
import { relativeTime } from '@/utils/time';
import type { Agent } from '@/types/agent';
import { Badge } from '@/components/ui/Badge';

const iconMap: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="w-5 h-5" />,
  Code2: <Code2 className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  Rocket: <Rocket className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
};

export function WorkspaceView() {
  const appDispatch = useAppDispatch();
  const { openDraft } = useChat();

  function handleWorkbenchClick(agent: Agent) {
    openDraft(agent.id);
    appDispatch({ type: 'NAVIGATE', view: 'chat' });
  }

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-surface-900">{greeting}, {currentUser.name.split(' ')[0]}</h1>
        <p className="text-sm text-surface-500 mt-1">{currentUser.role} &middot; Here is your workspace overview</p>
      </div>

      {/* My Workbenchs */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-surface-800">My Workbenchs</h2>
          <button
            onClick={() => appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'promptLibrary' })}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors font-medium"
          >
            <BookOpen className="w-4 h-4" />
            Prompt Library
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {agents.map((wb) => (
            <button
              key={wb.id}
              onClick={() => handleWorkbenchClick(wb)}
              className="group text-left p-5 bg-white border border-surface-200 rounded-xl hover:border-brand-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', wb.color)}>
                  {iconMap[wb.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-800 group-hover:text-brand-700 transition-colors">{wb.name}</h3>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-2">{wb.description}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {wb.capabilities.slice(0, 3).map((cap) => (
                  <span key={cap} className="text-[10px] px-2 py-0.5 bg-surface-50 text-surface-500 rounded-full border border-surface-100">{cap}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Summary Cards */}
      <section>
        <h2 className="text-base font-semibold text-surface-800 mb-4">Summary</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Information */}
          <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-800">Information</h3>
              <span className="text-xs text-surface-400">{informationItems.length} items</span>
            </div>
            <div className="divide-y divide-surface-100">
              {informationItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'informationDetail', entityId: item.id })}
                  className="w-full text-left px-5 py-3 hover:bg-surface-50 transition-colors"
                >
                  <p className="text-sm font-medium text-surface-700 truncate">{item.title}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{item.source} &middot; {relativeTime(item.updatedAt)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dashboards */}
          <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-800">Dashboards</h3>
              <span className="text-xs text-surface-400">{dashboardItems.length} metrics</span>
            </div>
            <div className="divide-y divide-surface-100">
              {dashboardItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'dashboardDetail', entityId: item.id })}
                  className="w-full text-left px-5 py-3 hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-surface-700">{item.title}</p>
                    <span className="text-sm font-semibold text-surface-800">{item.value}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MiniBar data={item.chartData} />
                    <span className={cn(
                      'text-xs font-medium',
                      item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-600' : 'text-surface-500',
                    )}>
                      {item.trend === 'up' ? '+' : ''}{item.trendPercent}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-800">Tasks</h3>
              <span className="text-xs text-surface-400">{taskItems.length} tasks</span>
            </div>
            <div className="divide-y divide-surface-100">
              {taskItems.slice(0, 4).map((item) => {
                const statusVariant = { pending: 'default', in_progress: 'info', completed: 'success', blocked: 'error' } as const;
                return (
                  <button
                    key={item.id}
                    onClick={() => appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'taskRoutePreview', entityId: item.id })}
                    className="w-full text-left px-5 py-3 hover:bg-surface-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-surface-700 truncate">{item.title}</p>
                      <Badge label={item.status.replace('_', ' ')} variant={statusVariant[item.status]} />
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">{item.assignedAgent} &middot; {item.priority} priority</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniBar({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-px h-4">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 bg-brand-400 rounded-sm transition-all"
          style={{ height: `${(v / max) * 100}%`, minHeight: 2 }}
        />
      ))}
    </div>
  );
}
