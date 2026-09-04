import { useAppState } from '@/context/AppContext';
import { WorkspaceView } from '@/components/workspace/WorkspaceView';
import { ChatView } from '@/components/chat/ChatView';
import { MonitorView } from '@/components/monitor/MonitorView';

export function MainArea() {
  const { activeView } = useAppState();

  return (
    <main className="overflow-y-auto bg-white">
      {activeView === 'workspace' && <WorkspaceView />}
      {activeView === 'chat' && <ChatView />}
      {activeView === 'monitor' && <MonitorView />}
    </main>
  );
}
