export function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return q.split(/\s+/).every((word) => lower.includes(word));
}
