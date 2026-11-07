/**
 * Daily time-series helpers. All windows are explicit [start, end] UTC dates, inclusive,
 * and every aggregate reports how many days it actually covered so partial windows are
 * visible instead of silently summed.
 */

export type DailyPoint = [day: string, value: number];

export const DAY_MS = 86_400_000;

export function isoDay(d: Date | number): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  return isoDay(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS);
}

/** Converts DefiLlama `[unixSeconds, value]` pairs to sorted daily points, dropping non-finite values. */
export function fromUnixPairs(pairs: unknown): DailyPoint[] {
  if (!Array.isArray(pairs)) return [];
  const out: DailyPoint[] = [];
  for (const p of pairs) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const t = Number(p[0]);
    const v = Number(p[1]);
    if (!Number.isFinite(t) || !Number.isFinite(v)) continue;
    out.push([isoDay(t * 1000), v]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

export interface WindowSum {
  start: string;
  end: string;
  expectedDays: number;
  coveredDays: number;
  sum: number | null;
  mean: number | null;
}

/** Sum and mean over an inclusive window. Returns null aggregates if any day is missing. */
export function windowAggregate(series: DailyPoint[], end: string, days: number): WindowSum {
  const start = addDays(end, -(days - 1));
  const inWin = series.filter(([d]) => d >= start && d <= end);
  const uniqueDays = new Set(inWin.map(([d]) => d)).size;
  const complete = uniqueDays === days;
  const sum = inWin.reduce((a, [, v]) => a + v, 0);
  return {
    start,
    end,
    expectedDays: days,
    coveredDays: uniqueDays,
    sum: complete ? sum : null,
    mean: complete ? sum / days : null,
  };
}

/** Last day present in a series, or null. */
export function lastDay(series: DailyPoint[]): string | null {
  return series.length ? (series[series.length - 1] as DailyPoint)[0] : null;
}

/**
 * The common analysis end date across several daily series: the earliest of their last
 * days, minus `dropPartial` days because providers often publish a partial latest day.
 */
export function commonEnd(seriesList: DailyPoint[][], dropPartial = 1): string | null {
  const ends = seriesList.map(lastDay);
  if (ends.some((e) => e === null)) return null;
  const min = (ends as string[]).sort()[0] as string;
  return addDays(min, -dropPartial);
}

/** Weekly sums (weeks ending on `end`), for charts. Only complete weeks are emitted. */
export function weeklySums(series: DailyPoint[], end: string, weeks: number): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const wEnd = addDays(end, -7 * w);
    const agg = windowAggregate(series, wEnd, 7);
    if (agg.sum !== null) out.push([wEnd, agg.sum]);
  }
  return out;
}

/** Weekly means, for level metrics such as daily active accounts or TVL. */
export function weeklyMeans(series: DailyPoint[], end: string, weeks: number): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const wEnd = addDays(end, -7 * w);
    const agg = windowAggregate(series, wEnd, 7);
    if (agg.mean !== null) out.push([wEnd, agg.mean]);
  }
  return out;
}

export function valueOn(series: DailyPoint[], day: string): number | null {
  const hit = series.find(([d]) => d === day);
  return hit ? hit[1] : null;
}

export function pctChange(from: number | null, to: number | null): number | null {
  if (from === null || to === null || !Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return (to - from) / Math.abs(from);
}

export function safeDiv(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}
