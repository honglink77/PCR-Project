export type SummaryCardType = 'information' | 'dashboard' | 'task';

export interface InformationItem {
  id: string;
  title: string;
  source: string;
  updatedAt: number;
  category: string;
  snippet: string;
}

export interface DashboardItem {
  id: string;
  title: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  trendPercent: number;
  chartData: number[];
  category: string;
}

export interface TaskItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent: string;
  route: string[];
  dueAt: number | null;
}
