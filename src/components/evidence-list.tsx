import { TypeBadge } from './brand';
import { ExternalLink } from './ui';
import { formatPeriod, formatValue } from '@/lib/format';

export interface EvidenceRowData {
  evidenceId: string;
  label: string;
  value: number | null;
  valueText: string | null;
  unit: string;
  observationType: string;
  available: boolean;
  sourceName: string;
  sourceUrl: string;
  periodStart: string | null;
  periodEnd: string | null;
  validationNotes: string | null;
  methodology?: string;
  transform?: string;
  rawResponseHash?: string | null;
}

/** Evidence register table. On small screens rows stack into cards. */
export function EvidenceTable({ items, highlight = [] }: { items: EvidenceRowData[]; highlight?: string[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border hairline">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Evidence items with values, type, period and source</caption>
        <thead className="hidden bg-raised text-xs text-muted md:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-normal">Evidence</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Value</th>
            <th scope="col" className="px-4 py-2.5 font-normal">Type</th>
            <th scope="col" className="px-4 py-2.5 font-normal">Period</th>
            <th scope="col" className="px-4 py-2.5 font-normal">Source</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.evidenceId} className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t hairline px-4 py-3 md:table-row md:p-0 ${highlight.includes(e.evidenceId) ? 'bg-[rgb(0_236_151/0.04)]' : ''}`}>
              <td className="md:px-4 md:py-3">
                <p className="leading-snug text-fg">{e.label}</p>
                <p className="num mt-0.5 text-[0.6875rem] text-faint">{e.evidenceId}</p>
                {e.validationNotes && <p className="mt-1 max-w-md text-xs leading-snug text-muted">{e.validationNotes}</p>}
              </td>
              <td className="text-right align-top md:px-4 md:py-3">
                {e.valueText ? <span className="text-xs text-muted">Text (see source)</span> : <span className={`num ${e.available ? 'text-fg' : 'text-muted'}`}>{e.available ? formatValue(e.value, e.unit) : 'Unavailable'}</span>}
              </td>
              <td className="align-top md:px-4 md:py-3"><TypeBadge type={e.observationType} /></td>
              <td className="align-top text-xs text-muted md:px-4 md:py-3">{formatPeriod(e.periodStart, e.periodEnd)}</td>
              <td className="col-span-2 align-top text-xs md:col-span-1 md:px-4 md:py-3"><ExternalLink href={e.sourceUrl}>{e.sourceName}</ExternalLink></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
