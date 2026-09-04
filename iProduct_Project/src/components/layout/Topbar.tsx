import { Activity, Bell, LogOut, Settings, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Avatar';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { currentUser } from '@/data/users';
import { cn } from '@/utils/cn';

export function Topbar() {
  const { activeView, notifications } = useAppState();
  const dispatch = useAppDispatch();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="col-span-full flex items-center justify-between px-4 bg-white border-b border-surface-200 z-40">
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'workspace' })}
        className="flex items-center gap-2 rounded-lg px-1 -ml-1 py-1 hover:bg-surface-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">iP</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-surface-800">iProduct</span>
          <span className="text-xs text-surface-400 ml-1.5">Workspace</span>
        </div>
      </button>

      <div className="flex items-center gap-1">
        <IconButton
          label="Monitor"
          active={activeView === 'monitor'}
          onClick={() => dispatch({ type: 'NAVIGATE', view: activeView === 'monitor' ? 'workspace' : 'monitor' })}
        >
          <Activity className="w-[18px] h-[18px]" />
        </IconButton>

        <div ref={notifRef} className="relative">
          <IconButton label="Notifications" badge={unreadCount} onClick={() => setNotifOpen(!notifOpen)}>
            <Bell className="w-[18px] h-[18px]" />
          </IconButton>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-surface-200 py-2 animate-fade-in z-50">
              <div className="px-4 py-2 border-b border-surface-100">
                <h3 className="text-sm font-semibold text-surface-800">Notifications</h3>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-surface-400 text-center">No notifications</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', id: n.id })}
                      className={cn('w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors', !n.read && 'bg-brand-50/30')}
                    >
                      <p className="text-sm font-medium text-surface-800">{n.title}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{n.body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative ml-1">
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full">
            <Avatar name={currentUser.name} initials={currentUser.initials} size="sm" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-200 py-1 animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-semibold text-surface-800">{currentUser.name}</p>
                <p className="text-xs text-surface-500">{currentUser.role}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                <User className="w-4 h-4" /> Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-surface-100 mt-1 pt-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
