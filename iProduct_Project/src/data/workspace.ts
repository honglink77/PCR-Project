import type { InformationItem, DashboardItem, TaskItem } from '@/types/workspace';

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 86_400_000;

export const informationItems: InformationItem[] = [
  { id: 'info-1', title: 'Q3 Market Analysis Complete', source: 'Market Analyst', updatedAt: now - HOUR, category: 'Research', snippet: 'Enterprise AI market reached $8.2B with 34% CAGR. Product analytics leads at $2.8B.' },
  { id: 'info-2', title: 'Competitor Pricing Update', source: 'Market Analyst', updatedAt: now - 3 * HOUR, category: 'Competitive Intel', snippet: 'CompetitorA raised enterprise tier by 15%. CompetitorC launched free tier targeting startups.' },
  { id: 'info-3', title: 'User Interview Synthesis', source: 'UX Researcher', updatedAt: now - DAY, category: 'Research', snippet: '18 interviews synthesized into 3 personas: Strategic Sarah, Analytical Alex, Operational Oscar.' },
  { id: 'info-4', title: 'Tech Debt Assessment', source: 'Tech Advisor', updatedAt: now - 2 * DAY, category: 'Engineering', snippet: 'Critical tech debt items identified in notification system and data pipeline components.' },
  { id: 'info-5', title: 'Q2 Retrospective Summary', source: 'Product Strategist', updatedAt: now - 3 * DAY, category: 'Operations', snippet: 'Delivered 87% of planned features. Key miss: API marketplace delayed to Q3.' },
];

export const dashboardItems: DashboardItem[] = [
  { id: 'dash-1', title: 'Daily Active Users', value: '12,847', trend: 'up', trendPercent: 8.3, chartData: [85, 88, 82, 91, 95, 102, 108], category: 'Engagement' },
  { id: 'dash-2', title: 'Feature Adoption', value: '67%', trend: 'up', trendPercent: 3.1, chartData: [58, 60, 62, 63, 64, 65, 67], category: 'Product' },
  { id: 'dash-3', title: 'NPS Score', value: '72', trend: 'flat', trendPercent: 0.5, chartData: [71, 73, 72, 71, 72, 73, 72], category: 'Satisfaction' },
  { id: 'dash-4', title: 'Monthly Churn', value: '2.1%', trend: 'down', trendPercent: -0.4, chartData: [1.8, 1.7, 1.6, 1.7, 1.8, 1.9, 2.1], category: 'Revenue' },
  { id: 'dash-5', title: 'Avg Session Duration', value: '24m', trend: 'up', trendPercent: 12.0, chartData: [18, 19, 20, 21, 22, 23, 24], category: 'Engagement' },
  { id: 'dash-6', title: 'API Calls / Day', value: '1.2M', trend: 'up', trendPercent: 22.5, chartData: [680, 750, 820, 900, 980, 1050, 1200], category: 'Platform' },
];

export const taskItems: TaskItem[] = [
  { id: 'task-1', title: 'Launch custom dashboard builder', status: 'in_progress', priority: 'high', assignedAgent: 'Product Strategist', route: ['Design Review', 'Development', 'QA', 'Staging', 'Production'], dueAt: now + 5 * DAY },
  { id: 'task-2', title: 'Integrate third-party analytics SDK', status: 'pending', priority: 'medium', assignedAgent: 'Tech Advisor', route: ['Feasibility', 'Implementation', 'Testing', 'Deploy'], dueAt: now + 10 * DAY },
  { id: 'task-3', title: 'Conduct user interviews (Batch 4)', status: 'in_progress', priority: 'medium', assignedAgent: 'UX Researcher', route: ['Recruitment', 'Scheduling', 'Interviews', 'Synthesis', 'Report'], dueAt: now + 3 * DAY },
  { id: 'task-4', title: 'A/B test: onboarding wizard variants', status: 'pending', priority: 'high', assignedAgent: 'Growth Engine', route: ['Design', 'Implement', 'Launch', 'Analyze', 'Decide'], dueAt: now + 14 * DAY },
  { id: 'task-5', title: 'Resolve notification system tech debt', status: 'blocked', priority: 'critical', assignedAgent: 'Tech Advisor', route: ['Audit', 'Refactor', 'Test', 'Deploy'], dueAt: now + 7 * DAY },
  { id: 'task-6', title: 'Update competitor feature matrix', status: 'completed', priority: 'low', assignedAgent: 'Market Analyst', route: ['Research', 'Compare', 'Document'], dueAt: now - DAY },
];
