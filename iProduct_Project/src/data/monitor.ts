import type { AgentRun } from '@/types/agent';
import type { MonitorDependency, FreshnessEntry, MonitorException } from '@/types/monitor';
import type { TaskItem } from '@/types/workspace';

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 86_400_000;

export const monitorAgentRuns: AgentRun[] = [
  { id: 'run-1', agentId: 'portfolio-planning', agentName: 'Portfolio Planning', status: 'running', startedAt: now - 15 * 60_000, completedAt: null, durationMs: null, triggerType: 'scheduled', taskCount: 3 },
  { id: 'run-2', agentId: 'product-design', agentName: 'Product Design', status: 'completed', startedAt: now - 2 * HOUR, completedAt: now - 2 * HOUR + 340_000, durationMs: 340_000, triggerType: 'manual', taskCount: 5 },
  { id: 'run-3', agentId: 'dev-project', agentName: 'Dev Project', status: 'completed', startedAt: now - 4 * HOUR, completedAt: now - 4 * HOUR + 120_000, durationMs: 120_000, triggerType: 'event', taskCount: 2 },
  { id: 'run-4', agentId: 'product-release', agentName: 'Product Release', status: 'failed', startedAt: now - 6 * HOUR, completedAt: now - 6 * HOUR + 45_000, durationMs: 45_000, triggerType: 'manual', taskCount: 1, errorMessage: 'Timeout: External survey API did not respond within 30s' },
  { id: 'run-5', agentId: 'product-ops', agentName: 'Product Ops', status: 'completed', startedAt: now - DAY, completedAt: now - DAY + 560_000, durationMs: 560_000, triggerType: 'scheduled', taskCount: 8 },
  { id: 'run-6', agentId: 'knowledge-management', agentName: 'Knowledge Management', status: 'cancelled', startedAt: now - DAY - HOUR, completedAt: now - DAY - HOUR + 20_000, durationMs: 20_000, triggerType: 'manual', taskCount: 0 },
];

export const monitorTasks: TaskItem[] = [
  { id: 'mt-1', title: 'Refresh competitor pricing data', status: 'in_progress', priority: 'high', assignedAgent: 'Market Analyst', route: ['Scrape', 'Validate', 'Store'], dueAt: now + HOUR },
  { id: 'mt-2', title: 'Generate weekly KPI report', status: 'pending', priority: 'medium', assignedAgent: 'Data Scientist', route: ['Query', 'Aggregate', 'Format', 'Deliver'], dueAt: now + 2 * HOUR },
  { id: 'mt-3', title: 'Summarize interview transcripts', status: 'completed', priority: 'medium', assignedAgent: 'UX Researcher', route: ['Transcribe', 'Extract Themes', 'Summarize'], dueAt: now - HOUR },
  { id: 'mt-4', title: 'Run dependency vulnerability scan', status: 'in_progress', priority: 'critical', assignedAgent: 'Tech Advisor', route: ['Scan', 'Classify', 'Report'], dueAt: now + 30 * 60_000 },
  { id: 'mt-5', title: 'Optimize onboarding funnel query', status: 'blocked', priority: 'high', assignedAgent: 'Growth Engine', route: ['Analyze', 'Rewrite', 'Test', 'Deploy'], dueAt: now + DAY },
];

export const monitorDependencies: MonitorDependency[] = [
  { id: 'dep-1', name: 'OpenAI GPT-4', type: 'model', status: 'healthy', latencyMs: 890, lastChecked: now - 5 * 60_000 },
  { id: 'dep-2', name: 'Supabase DB', type: 'database', status: 'healthy', latencyMs: 12, lastChecked: now - 2 * 60_000 },
  { id: 'dep-3', name: 'Analytics API', type: 'api', status: 'degraded', latencyMs: 2300, lastChecked: now - 3 * 60_000 },
  { id: 'dep-4', name: 'Survey Service', type: 'service', status: 'down', latencyMs: 0, lastChecked: now - 10 * 60_000 },
  { id: 'dep-5', name: 'Anthropic Claude', type: 'model', status: 'healthy', latencyMs: 720, lastChecked: now - 4 * 60_000 },
  { id: 'dep-6', name: 'Redis Cache', type: 'database', status: 'healthy', latencyMs: 3, lastChecked: now - 60_000 },
  { id: 'dep-7', name: 'Webhook Gateway', type: 'service', status: 'healthy', latencyMs: 45, lastChecked: now - 2 * 60_000 },
];

export const monitorFreshness: FreshnessEntry[] = [
  { id: 'fr-1', sourceName: 'Market Pricing Data', dataType: 'Competitor Intel', lastUpdated: now - 4 * HOUR, threshold: 6 * HOUR, status: 'fresh' },
  { id: 'fr-2', sourceName: 'User Analytics', dataType: 'Product Metrics', lastUpdated: now - 30 * 60_000, threshold: HOUR, status: 'fresh' },
  { id: 'fr-3', sourceName: 'Survey Responses', dataType: 'User Research', lastUpdated: now - 2 * DAY, threshold: DAY, status: 'stale' },
  { id: 'fr-4', sourceName: 'Tech Debt Registry', dataType: 'Engineering', lastUpdated: now - 5 * DAY, threshold: 3 * DAY, status: 'critical' },
  { id: 'fr-5', sourceName: 'NPS Scores', dataType: 'Satisfaction', lastUpdated: now - 12 * HOUR, threshold: DAY, status: 'fresh' },
  { id: 'fr-6', sourceName: 'Feature Usage Stats', dataType: 'Product', lastUpdated: now - 2 * HOUR, threshold: 4 * HOUR, status: 'fresh' },
];

export const monitorExceptions: MonitorException[] = [
  { id: 'ex-1', message: 'Survey API connection timeout', severity: 'high', count: 23, firstSeen: now - DAY, lastSeen: now - 6 * HOUR, agentId: 'product-release' },
  { id: 'ex-2', message: 'Rate limit exceeded on Analytics API', severity: 'medium', count: 8, firstSeen: now - 12 * HOUR, lastSeen: now - 3 * HOUR, agentId: 'product-design' },
  { id: 'ex-3', message: 'Malformed response from competitor scraper', severity: 'low', count: 3, firstSeen: now - 2 * DAY, lastSeen: now - DAY, agentId: 'portfolio-planning' },
  { id: 'ex-4', message: 'Memory threshold exceeded during batch analysis', severity: 'critical', count: 1, firstSeen: now - 2 * HOUR, lastSeen: now - 2 * HOUR, agentId: 'product-ops' },
];
