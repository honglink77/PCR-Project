export type AppView = 'workspace' | 'chat' | 'monitor';

export type RightRailMode =
  | 'allChats'
  | 'informationDetail'
  | 'dashboardDetail'
  | 'taskRoutePreview'
  | 'promptLibrary'
  | 'contextDetail';

export interface RightRailState {
  open: boolean;
  mode: RightRailMode | null;
  entityId: string | null;
}

export interface ConfirmationGateState {
  open: boolean;
  title: string;
  description: string;
  riskLevel: 'medium' | 'high' | 'critical';
  onConfirm: (() => void) | null;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface AppState {
  activeView: AppView;
  sidebarCollapsed: boolean;
  rightRail: RightRailState;
  confirmationGate: ConfirmationGateState;
  notifications: AppNotification[];
}

export type AppAction =
  | { type: 'NAVIGATE'; view: AppView }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'OPEN_RIGHT_RAIL'; mode: RightRailMode; entityId?: string }
  | { type: 'CLOSE_RIGHT_RAIL' }
  | { type: 'OPEN_CONFIRMATION'; payload: Omit<ConfirmationGateState, 'open'> }
  | { type: 'CLOSE_CONFIRMATION' }
  | { type: 'DISMISS_NOTIFICATION'; id: string };
