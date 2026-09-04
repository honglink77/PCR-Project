export type AgentStatus = 'active' | 'idle' | 'error' | 'maintenance';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: AgentStatus;
  capabilities: string[];
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
