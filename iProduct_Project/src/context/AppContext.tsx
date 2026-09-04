import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppState, AppAction } from '@/types/app';
import { mockNotifications } from '@/data/users';

const initialState: AppState = {
  activeView: 'workspace',
  sidebarCollapsed: false,
  rightRail: { open: false, mode: null, entityId: null },
  confirmationGate: { open: false, title: '', description: '', riskLevel: 'medium', onConfirm: null },
  notifications: mockNotifications,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, activeView: action.view, rightRail: { open: false, mode: null, entityId: null } };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'OPEN_RIGHT_RAIL':
      return { ...state, rightRail: { open: true, mode: action.mode, entityId: action.entityId ?? null } };
    case 'CLOSE_RIGHT_RAIL':
      return { ...state, rightRail: { open: false, mode: null, entityId: null } };
    case 'OPEN_CONFIRMATION':
      return { ...state, confirmationGate: { open: true, ...action.payload } };
    case 'CLOSE_CONFIRMATION':
      return { ...state, confirmationGate: { ...state.confirmationGate, open: false, onConfirm: null } };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.map((n) => n.id === action.id ? { ...n, read: true } : n) };
    default:
      return state;
  }
}

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}
