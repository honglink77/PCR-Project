export type MonitorTab = 'agentRuns' | 'tasks' | 'dependencies' | 'freshness' | 'exceptions';

export interface MonitorDependency {
  id: string;
  name: string;
  type: 'api' | 'database' | 'service' | 'model';
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: number;
}

export interface FreshnessEntry {
  id: string;
  sourceName: string;
  dataType: string;
  lastUpdated: number;
  threshold: number;
  status: 'fresh' | 'stale' | 'critical';
}

export interface MonitorException {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  firstSeen: number;
  lastSeen: number;
  agentId: string;
}

export interface MonitorState {
  activeTab: MonitorTab;
  isRefreshing: boolean;
}

export type MonitorAction =
  | { type: 'SET_TAB'; tab: MonitorTab }
  | { type: 'SET_REFRESHING'; refreshing: boolean };
