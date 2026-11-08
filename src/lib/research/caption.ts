/**
 * One plain sentence per chart, shared by the research page and the static dashboard.
 * Names the period the way the series is aggregated (month, week or point in time) and compares
 * the latest value with the series peak and with a year earlier, never with an arbitrary first point
 * (a contract's first month can have three transactions, which makes any growth rate meaningless).
 */
import { formatDate, formatValue, pct } from '@/lib/format';
import type { SeriesDef } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function periodOf(date: string, aggregation: SeriesDef['aggregation']): string {
  if (aggregation === 'month') return `in ${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
  if (aggregation === 'level') return `on ${formatDate(date)}`;
  return `in the week ending ${formatDate(date)}`;
}

function yearEarlier(points: [string, number][], last: string): [string, number] | null {
  const target = new Date(`${last}T00:00:00Z`);
  target.setUTCFullYear(target.getUTCFullYear() - 1);
  const t = target.getTime();
  let best: [string, number] | null = null;
  let bestGap = Infinity;
  for (const p of points) {
    const gap = Math.abs(new Date(`${p[0]}T00:00:00Z`).getTime() - t);
    if (gap < bestGap) { best = p; bestGap = gap; }
  }
  // Only use it if a point lies within ~3 weeks of exactly one year earlier.
  return best && bestGap <= 21 * 86_400_000 ? best : null;
}

export function chartSentence(s: Pick<SeriesDef, 'label' | 'unit' | 'aggregation' | 'points'>): string {
  const pts = s.points;
  const last = pts[pts.length - 1]!;
  const peak = pts.reduce((a, p) => (p[1] > a[1] ? p : a), pts[0]!);
  const parts = [`${s.label} was ${formatValue(last[1], s.unit)} ${periodOf(last[0], s.aggregation)}`];
  if (peak[0] === last[0]) parts.push('its highest value in this series');
  else if (peak[1] > 0) parts.push(`${pct(last[1] / peak[1], 0)} of its peak of ${formatValue(peak[1], s.unit)} ${periodOf(peak[0], s.aggregation)}`);
  const ya = yearEarlier(pts, last[0]);
  if (ya && ya[1] !== 0) {
    const change = (last[1] - ya[1]) / Math.abs(ya[1]);
    parts.push(`${change >= 0 ? 'up' : 'down'} ${pct(Math.abs(change), 0)} from ${formatValue(ya[1], s.unit)} a year earlier`);
  }
  return `${parts[0]}${parts.length > 1 ? `: ${parts.slice(1).join(', and ')}` : ''}.`;
}
