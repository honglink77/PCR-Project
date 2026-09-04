import { RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { useMonitor } from '@/context/MonitorContext';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { monitorAgentRuns, monitorTasks, monitorDependencies, monitorFreshness, monitorExceptions } from '@/data/monitor';
import { relativeTime, formatDuration } from '@/utils/time';
import { cn } from '@/utils/cn';
import type { MonitorTab } from '@/types/monitor';

const tabs = [
  { id: 'agentRuns' as MonitorTab, label: 'Agent Runs', count: monitorAgentRuns.length },
  { id: 'tasks' as MonitorTab, label: 'Tasks', count: monitorTasks.length },
  { id: 'dependencies' as MonitorTab, label: 'Dependencies', count: monitorDependencies.length },
  { id: 'freshness' as MonitorTab, label: 'Freshness', count: monitorFreshness.length },
  { id: 'exceptions' as MonitorTab, label: 'Exceptions', count: monitorExceptions.length },
];

export function MonitorView() {
  const { state, dispatch } = useMonitor();

  function handleRefresh() {
    dispatch({ type: 'SET_REFRESHING', refreshing: true });
    setTimeout(() => dispatch({ type: 'SET_REFRESHING', refreshing: false }), 1000);
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-semibold text-surface-900">Monitor</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={state.isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', state.isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <Tabs items={tabs} activeId={state.activeTab} onChange={(id) => dispatch({ type: 'SET_TAB', tab: id as MonitorTab })} />

      <div className="mt-6">
        {state.activeTab === 'agentRuns' && <AgentRunsTab />}
        {state.activeTab === 'tasks' && <TasksTab />}
        {state.activeTab === 'dependencies' && <DependenciesTab />}
        {state.activeTab === 'freshness' && <FreshnessTab />}
        {state.activeTab === 'exceptions' && <ExceptionsTab />}
      </div>
    </div>
  );
}

function AgentRunsTab() {
  const runStatus: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; dot: 'success' | 'warning' | 'error' | 'running' | 'neutral' }> = {
    running: { variant: 'info', dot: 'running' },
    completed: { variant: 'success', dot: 'success' },
    failed: { variant: 'error', dot: 'error' },
    cancelled: { variant: 'warning', dot: 'neutral' },
  };

  return (
    <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 text-left">
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Agent</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Trigger</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Tasks</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Duration</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Started</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {monitorAgentRuns.map((run) => {
            const s = runStatus[run.status];
            return (
              <tr key={run.id} className="hover:bg-surface-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-surface-800">{run.agentName}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <StatusDot status={s.dot} pulse={run.status === 'running'} />
                    <Badge label={run.status} variant={s.variant} />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-surface-500 capitalize">{run.triggerType}</td>
                <td className="px-5 py-3.5 text-surface-600">{run.taskCount}</td>
                <td className="px-5 py-3.5 text-surface-600 font-mono text-xs">{run.durationMs ? formatDuration(run.durationMs) : '--'}</td>
                <td className="px-5 py-3.5 text-surface-500">{relativeTime(run.startedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TasksTab() {
  const statusVariant = { pending: 'default', in_progress: 'info', completed: 'success', blocked: 'error' } as const;
  const priorityVariant = { low: 'default', medium: 'warning', high: 'error', critical: 'error' } as const;

  return (
    <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 text-left">
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Task</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Priority</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Agent</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Route Steps</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {monitorTasks.map((task) => (
            <tr key={task.id} className="hover:bg-surface-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-surface-800 max-w-xs truncate">{task.title}</td>
              <td className="px-5 py-3.5"><Badge label={task.status.replace('_', ' ')} variant={statusVariant[task.status]} /></td>
              <td className="px-5 py-3.5"><Badge label={task.priority} variant={priorityVariant[task.priority]} /></td>
              <td className="px-5 py-3.5 text-surface-500">{task.assignedAgent}</td>
              <td className="px-5 py-3.5 text-surface-400 text-xs">{task.route.join(' > ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DependenciesTab() {
  const statusMap: Record<string, { variant: 'success' | 'warning' | 'error'; dot: 'success' | 'warning' | 'error' }> = {
    healthy: { variant: 'success', dot: 'success' },
    degraded: { variant: 'warning', dot: 'warning' },
    down: { variant: 'error', dot: 'error' },
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {monitorDependencies.map((dep) => {
        const s = statusMap[dep.status];
        return (
          <div key={dep.id} className="bg-white border border-surface-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StatusDot status={s.dot} pulse={dep.status !== 'healthy'} />
                <h3 className="text-sm font-semibold text-surface-800">{dep.name}</h3>
              </div>
              <Badge label={dep.status} variant={s.variant} />
            </div>
            <div className="flex items-center justify-between text-xs text-surface-500">
              <span className="capitalize">{dep.type}</span>
              <span className="font-mono">{dep.latencyMs > 0 ? `${dep.latencyMs}ms` : 'N/A'}</span>
            </div>
            <p className="text-[11px] text-surface-400 mt-2">Last checked {relativeTime(dep.lastChecked)}</p>
          </div>
        );
      })}
    </div>
  );
}

function FreshnessTab() {
  const statusVariant = { fresh: 'success', stale: 'warning', critical: 'error' } as const;

  return (
    <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 text-left">
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Source</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Data Type</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {monitorFreshness.map((entry) => (
            <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-surface-800">{entry.sourceName}</td>
              <td className="px-5 py-3.5 text-surface-500">{entry.dataType}</td>
              <td className="px-5 py-3.5"><Badge label={entry.status} variant={statusVariant[entry.status]} dot /></td>
              <td className="px-5 py-3.5 text-surface-500">{relativeTime(entry.lastUpdated)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExceptionsTab() {
  const severityVariant = { low: 'default', medium: 'warning', high: 'error', critical: 'error' } as const;

  return (
    <div className="space-y-3">
      {monitorExceptions.map((ex) => (
        <div key={ex.id} className="bg-white border border-surface-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn(
              'w-5 h-5 flex-shrink-0 mt-0.5',
              ex.severity === 'critical' || ex.severity === 'high' ? 'text-red-500' : ex.severity === 'medium' ? 'text-amber-500' : 'text-surface-400',
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-surface-800">{ex.message}</p>
                <Badge label={ex.severity} variant={severityVariant[ex.severity]} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                <span>Count: <strong className="text-surface-600">{ex.count}</strong></span>
                <span>Last seen: {relativeTime(ex.lastSeen)}</span>
                <span>First seen: {relativeTime(ex.firstSeen)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
