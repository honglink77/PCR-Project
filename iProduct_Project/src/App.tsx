import { AppProvider } from '@/context/AppContext';
import { ChatProvider } from '@/context/ChatContext';
import { MonitorProvider } from '@/context/MonitorContext';
import { AppShell } from '@/components/layout/AppShell';

export default function App() {
  return (
    <AppProvider>
      <ChatProvider>
        <MonitorProvider>
          <AppShell />
        </MonitorProvider>
      </ChatProvider>
    </AppProvider>
  );
}
