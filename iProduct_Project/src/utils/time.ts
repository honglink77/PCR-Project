const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < DAY * 2) return 'Yesterday';
  if (diff < DAY * 7) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isYesterday(ts: number): boolean {
  const d = new Date(ts);
  const y = new Date(Date.now() - DAY);
  return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < MINUTE) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m ${Math.floor((ms % MINUTE) / 1000)}s`;
  return `${Math.floor(ms / HOUR)}h ${Math.floor((ms % HOUR) / MINUTE)}m`;
}
