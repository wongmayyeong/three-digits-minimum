/** Display formatting shared by server and client. Units are always explicit. */

export type DisplayUnit = 'USD' | 'NEAR' | 'count' | 'fraction' | 'ratio' | 'text';

function compact(n: number, digits = 2): string {
  const a = Math.abs(n);
  if (a >= 1e12) return `${(n / 1e12).toFixed(digits)}T`;
  if (a >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (a >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: a < 10 ? 2 : 0 });
}

export function pct(n: number, digits?: number): string {
  const v = n * 100;
  const d = digits ?? (Math.abs(v) < 1 ? 3 : Math.abs(v) < 10 ? 2 : 1);
  return `${v.toFixed(d)}%`;
}

export function formatValue(value: number | null | undefined, unit: DisplayUnit | string, opts: { signed?: boolean } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
  const sign = opts.signed && value > 0 ? '+' : '';
  switch (unit) {
    case 'USD':
      return `${value < 0 ? '-' : sign}$${compact(Math.abs(value))}`;
    case 'NEAR':
      return `${sign}${compact(value)} NEAR`;
    case 'count':
      return `${sign}${Math.abs(value) >= 1e6 ? compact(value) : Math.round(value).toLocaleString('en-US')}`;
    case 'fraction':
      return `${sign}${pct(value)}`;
    case 'ratio':
      return `${value >= 100 ? Math.round(value).toLocaleString('en-US') : value.toFixed(value >= 10 ? 1 : 2)}x`;
    default:
      return `${sign}${compact(value)}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'unknown date';
  if (/^block /.test(iso) || /^protocol /.test(iso)) return iso;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return 'unknown time';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} UTC`;
}

export function formatPeriod(start: string | null | undefined, end: string | null | undefined): string {
  if (start && end) return `${formatDate(start)} to ${formatDate(end)}`;
  if (end) return `as of ${formatDate(end)}`;
  return 'point in time';
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
