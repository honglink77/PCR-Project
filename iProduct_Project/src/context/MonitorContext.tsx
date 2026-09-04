import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { MonitorState, MonitorAction } from '@/types/monitor';

const initialState: MonitorState = {
  activeTab: 'agentRuns',
  isRefreshing: false,
};

function monitorReducer(state: MonitorState, action: MonitorAction): MonitorState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.refreshing };
    default:
      return state;
  }
}

interface MonitorContextValue {
  state: MonitorState;
  dispatch: Dispatch<MonitorAction>;
}

const MonitorCtx = createContext<MonitorContextValue | null>(null);

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(monitorReducer, initialState);
  return (
    <MonitorCtx.Provider value={{ state, dispatch }}>
      {children}
    </MonitorCtx.Provider>
  );
}

export function useMonitor() {
  const ctx = useContext(MonitorCtx);
  if (!ctx) throw new Error('useMonitor must be used within MonitorProvider');
  return ctx;
}
