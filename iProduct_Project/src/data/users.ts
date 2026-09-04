import type { AppNotification } from '@/types/app';

const now = Date.now();
const HOUR = 3_600_000;

export const currentUser = {
  id: 'user-1',
  name: 'Jordan Chen',
  email: 'jordan@company.com',
  role: 'Product Lead',
  initials: 'JC',
};

export const mockNotifications: AppNotification[] = [
  { id: 'n1', title: 'Market Analysis Complete', body: 'Q3 market sizing report is ready for review.', read: false, timestamp: now - HOUR, type: 'success' },
  { id: 'n2', title: 'Agent Error', body: 'UX Researcher encountered a timeout on Survey API.', read: false, timestamp: now - 3 * HOUR, type: 'error' },
  { id: 'n3', title: 'Task Blocked', body: 'Notification system refactor blocked by dependency.', read: true, timestamp: now - 6 * HOUR, type: 'warning' },
  { id: 'n4', title: 'Dashboard Updated', body: 'Monthly KPI dashboard has been refreshed.', read: true, timestamp: now - 12 * HOUR, type: 'info' },
];
