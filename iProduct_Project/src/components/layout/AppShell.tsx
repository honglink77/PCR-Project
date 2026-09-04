import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainArea } from '@/components/layout/MainArea';
import { RightRail } from '@/components/layout/RightRail';
import { ConfirmationGate } from '@/components/ConfirmationGate';
import { useAppState } from '@/context/AppContext';

export function AppShell() {
  const { sidebarCollapsed, rightRail } = useAppState();
  const sidebarW = sidebarCollapsed ? '60px' : '248px';
  const railW = rightRail.open ? '380px' : '0px';

  return (
    <div
      className="h-screen w-screen overflow-hidden grid grid-rows-[56px_1fr] transition-[grid-template-columns] duration-200 ease-in-out"
      style={{ gridTemplateColumns: `${sidebarW} 1fr ${railW}` }}
    >
      <Topbar />
      <Sidebar />
      <MainArea />
      {rightRail.open && <RightRail />}
      <ConfirmationGate />
    </div>
  );
}
