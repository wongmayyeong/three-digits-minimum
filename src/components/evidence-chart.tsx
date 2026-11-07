'use client';

/**
 * Single-series time-series chart for one evidence item. One series = no legend box; the
 * title names it. 2px line, 10% area wash, hairline grid, crosshair tooltip with unit,
 * window, provider and method. A data table is always available beneath.
 */
import { useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatValue } from '@/lib/format';

export interface ChartSeries {
  label: string;
  unit: string;
  aggregation: string;
  points: [string, number][];
}

const AGG: Record<string, string> = { sum7: 'weekly total', mean7: 'weekly average of daily values', level: 'weekly sample' };

function axisTick(v: number, unit: string): string {
  if (unit === 'fraction') return `${(v * 100).toFixed(0)}%`;
  const a = Math.abs(v);
  const s = a >= 1e9 ? `${(v / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B` : a >= 1e6 ? `${(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M` : a >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : `${Math.round(v)}`;
  return unit === 'USD' ? `$${s}` : s;
}

export function EvidenceChart({ series, source, method, tone = 'mint', height = 180, highlightLast = true, compact = false }: {
  series: ChartSeries; source: string; method?: string; tone?: 'mint' | 'coral' | 'neutral'; height?: number; highlightLast?: boolean; compact?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const [showTable, setShowTable] = useState(false);
  const color = tone === 'coral' ? '#ff7966' : tone === 'neutral' ? '#c9cdc5' : '#00ec97';
  const data = series.points.map(([d, v]) => ({ d, v }));
  const last = data[data.length - 1];
  if (!data.length) return <p className="text-sm text-muted">No series data in this snapshot.</p>;
  return (
    <figure className="w-full">
      <div style={{ height }} className="w-full" role="img" aria-label={`${series.label}: ${data.length} points from ${formatDate(data[0]!.d)} to ${formatDate(last!.d)}, latest ${formatValue(last!.v, series.unit)}. Source ${source}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: compact ? 4 : 8, bottom: 0, left: compact ? -12 : 0 }}>
            <defs>
              <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.14} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="d" tickLine={false} axisLine={false} minTickGap={48} tick={{ fill: '#949f98', fontSize: 11 }} tickFormatter={(d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })} />
            <YAxis tickLine={false} axisLine={false} width={compact ? 44 : 52} tick={{ fill: '#949f98', fontSize: 11 }} tickFormatter={(v: number) => axisTick(v, series.unit)} />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]!.payload as { d: string; v: number };
                return (
                  <div className="max-w-[240px] rounded-[var(--radius-sm)] border border-line-strong bg-raised px-3 py-2 text-xs shadow-lg">
                    <p className="num text-sm text-fg">{formatValue(p.v, series.unit)}</p>
                    <p className="mt-0.5 text-muted">Week ending {formatDate(p.d)} · {AGG[series.aggregation] ?? series.aggregation}</p>
                    <p className="mt-1 text-muted">Source: {source}</p>
                    {method && <p className="mt-1 line-clamp-3 text-faint">{method}</p>}
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#g${id})`} isAnimationActive={false} dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#0c1210', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!compact && (
        <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>{series.label}, {AGG[series.aggregation] ?? series.aggregation}. Latest {highlightLast && last ? formatValue(last.v, series.unit) : ''} (week ending {formatDate(last?.d)}).</span>
          <button type="button" className="link text-xs" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable}>{showTable ? 'Hide data table' : 'Show data table'}</button>
        </figcaption>
      )}
      {showTable && (
        <div className="mt-2 max-h-56 overflow-auto rounded-[var(--radius-sm)] border hairline">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-raised text-muted"><tr><th className="px-3 py-1.5 font-normal">Week ending</th><th className="px-3 py-1.5 text-right font-normal">{series.unit}</th></tr></thead>
            <tbody>
              {[...data].reverse().map((r) => (
                <tr key={r.d} className="border-t hairline"><td className="px-3 py-1">{formatDate(r.d)}</td><td className="num px-3 py-1 text-right">{formatValue(r.v, series.unit)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
