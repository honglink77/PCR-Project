export type AgentStatus = 'active' | 'idle' | 'error' | 'maintenance';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: AgentStatus;
  capabilities: string[];
  externalUrl?: string; // 若存在，Workbench 卡片外跳而非 openDraft
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt: number | null;
  durationMs: number | null;
  triggerType: 'manual' | 'scheduled' | 'event';
  taskCount: number;
  errorMessage?: string;
}
