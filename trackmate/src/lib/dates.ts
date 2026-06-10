/** Local-timezone date helpers. All "day" values are YYYY-MM-DD strings. */

export function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toDayString(new Date());
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDayString(d);
}

/**
 * Count consecutive active days ending today (or yesterday, so an
 * unfinished day doesn't break the streak).
 */
export function computeStreak(activeDays: Set<string>): number {
  let streak = 0;
  let offset = activeDays.has(today()) ? 0 : 1;
  while (activeDays.has(daysAgo(offset + streak))) {
    streak += 1;
  }
  return streak;
}

export function friendlyDate(day: string): string {
  if (day === today()) return 'Today';
  if (day === daysAgo(1)) return 'Yesterday';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
