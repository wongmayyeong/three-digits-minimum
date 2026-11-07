/**
 * Structured comparison between two frozen snapshots (rematch). Percentage change is shown
 * only when both values share unit, methodology and transformation; otherwise the row is
 * flagged as not comparable.
 */

export interface DeltaInput {
  evidenceId: string;
  label: string;
  value: number | null;
  valueText: string | null;
  unit: string;
  available: boolean;
  methodology: string;
  transform: string;
  periodStart: string | null;
  periodEnd: string | null;
  fetchedAt: string | null;
  observedAt: string | null;
}

export type DeltaKind = 'changed' | 'unchanged' | 'new' | 'removed' | 'became_unavailable' | 'became_available' | 'not_comparable';

export interface DeltaRow {
  evidenceId: string;
  label: string;
  unit: string;
  kind: DeltaKind;
  previous: number | null;
  current: number | null;
  absChange: number | null;
  pctChange: number | null;
  previousPeriod: [string | null, string | null];
  currentPeriod: [string | null, string | null];
  previousSourceTime: string | null;
  currentSourceTime: string | null;
  warning: string | null;
}

function periodDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  return Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
}

export function snapshotDelta(prev: DeltaInput[], next: DeltaInput[]): DeltaRow[] {
  const ids = [...new Set([...prev.map((p) => p.evidenceId), ...next.map((n) => n.evidenceId)])];
  return ids.map((id) => {
    const a = prev.find((p) => p.evidenceId === id);
    const b = next.find((n) => n.evidenceId === id);
    const base = {
      evidenceId: id,
      label: (b ?? a)!.label,
      unit: (b ?? a)!.unit,
      previous: a?.available ? a.value : null,
      current: b?.available ? b.value : null,
      previousPeriod: [a?.periodStart ?? null, a?.periodEnd ?? null] as [string | null, string | null],
      currentPeriod: [b?.periodStart ?? null, b?.periodEnd ?? null] as [string | null, string | null],
      previousSourceTime: a?.fetchedAt ?? a?.observedAt ?? null,
      currentSourceTime: b?.fetchedAt ?? b?.observedAt ?? null,
      absChange: null as number | null,
      pctChange: null as number | null,
      warning: null as string | null,
    };
    if (!a) return { ...base, kind: 'new' as const };
    if (!b) return { ...base, kind: 'removed' as const };
    if (a.available && !b.available) return { ...base, kind: 'became_unavailable' as const };
    if (!a.available && b.available) return { ...base, kind: 'became_available' as const };
    if (!a.available && !b.available) return { ...base, kind: 'unchanged' as const };
    if (a.valueText !== null || b.valueText !== null) {
      return { ...base, kind: a.valueText === b.valueText ? 'unchanged' as const : 'changed' as const };
    }
    const sameMethod = a.unit === b.unit && a.methodology === b.methodology && a.transform.replace(/ending \d{4}-\d{2}-\d{2}/, '') === b.transform.replace(/ending \d{4}-\d{2}-\d{2}/, '');
    const sameLength = periodDays(a.periodStart, a.periodEnd) === periodDays(b.periodStart, b.periodEnd);
    const absChange = a.value !== null && b.value !== null ? b.value - a.value : null;
    if (!sameMethod || !sameLength) {
      return { ...base, absChange, kind: 'not_comparable' as const, warning: !sameMethod ? 'Methodology or unit differs between snapshots; percentage change suppressed.' : 'Measurement windows differ in length; percentage change suppressed.' };
    }
    const pct = a.value !== null && b.value !== null && a.value !== 0 ? (b.value - a.value) / Math.abs(a.value) : null;
    const unchanged = absChange === 0;
    return { ...base, absChange, pctChange: pct, kind: unchanged ? 'unchanged' as const : 'changed' as const };
  });
}
