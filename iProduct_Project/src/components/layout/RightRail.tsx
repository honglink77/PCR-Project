import { X } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { AllChatsPanel } from '@/components/rightrail/AllChatsPanel';
import { InformationDetail } from '@/components/rightrail/InformationDetail';
import { DashboardDetail } from '@/components/rightrail/DashboardDetail';
import { TaskRoutePreview } from '@/components/rightrail/TaskRoutePreview';
import { PromptLibrary } from '@/components/rightrail/PromptLibrary';
import { ContextDetail } from '@/components/rightrail/ContextDetail';

const modeLabels: Record<string, string> = {
  allChats: 'All Chats',
  informationDetail: 'Information',
  dashboardDetail: 'Dashboard',
  taskRoutePreview: 'Task Route',
  promptLibrary: 'Prompt Library',
  contextDetail: 'Source Detail',
};

export function RightRail() {
  const { rightRail } = useAppState();
  const dispatch = useAppDispatch();

  if (!rightRail.open || !rightRail.mode) return null;

  return (
    <aside className="flex flex-col bg-white border-l border-surface-200 overflow-hidden animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <h2 className="text-sm font-semibold text-surface-800">{modeLabels[rightRail.mode] ?? 'Details'}</h2>
        <button
          onClick={() => dispatch({ type: 'CLOSE_RIGHT_RAIL' })}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rightRail.mode === 'allChats' && <AllChatsPanel />}
        {rightRail.mode === 'informationDetail' && <InformationDetail entityId={rightRail.entityId} />}
        {rightRail.mode === 'dashboardDetail' && <DashboardDetail entityId={rightRail.entityId} />}
        {rightRail.mode === 'taskRoutePreview' && <TaskRoutePreview entityId={rightRail.entityId} />}
        {rightRail.mode === 'promptLibrary' && <PromptLibrary />}
        {rightRail.mode === 'contextDetail' && <ContextDetail entityId={rightRail.entityId} />}
      </div>
    </aside>
  );
}
