import Link from 'next/link';
import { EvidenceChart } from './evidence-chart';
import { ExternalLink } from './ui';
import { formatDate, formatValue } from '@/lib/format';
import type { EraResult, EventResult, FinalVerdict, SectionVerdict, SupplyResult } from '@/lib/research/thesis';
import type { TriggerResult } from '@/lib/research/triggers';

const SECTION_TONE: Record<SectionVerdict, { label: string; cls: string }> = {
  BUILDING: { label: 'Points to building', cls: 'border-[rgb(0_236_151/0.5)] text-mint' },
  HYPE: { label: 'Points to hype', cls: 'border-[rgb(255_121_102/0.55)] text-coral' },
  MIXED: { label: 'Mixed', cls: 'border-[rgb(245_196_81/0.5)] text-amber' },
  INSUFFICIENT: { label: 'Insufficient evidence', cls: 'border-line-strong text-muted' },
};

export function SectionBadge({ verdict }: { verdict: SectionVerdict }) {
  const t = SECTION_TONE[verdict];
  return <span className={`chip h-7 px-2.5 text-xs ${t.cls}`}>{t.label}</span>;
}

export function FinalVerdictLabel({ verdict }: { verdict: FinalVerdict }) {
  const cls = verdict === 'BUILDING' ? 'text-mint' : verdict === 'FOLLOWING THE HYPE' ? 'text-coral' : verdict === 'INSUFFICIENT EVIDENCE' ? 'text-muted' : 'text-amber';
  const text: Record<FinalVerdict, string> = {
    BUILDING: 'Building the future',
    'FOLLOWING THE HYPE': 'Following the hype',
    'BUILDING, NOT YET PAYING': 'Technology is building; the investment case is unproven',
    'PAYING, NOT LASTING': 'The token is paid, but products are not lasting',
    MIXED: 'Mixed evidence',
    'INSUFFICIENT EVIDENCE': 'Insufficient evidence',
  };
  return <span className={cls}>{text[verdict]}</span>;
}

export function SectionHeader({ n, title, question, verdict, reason, howHref }: { n: number; title: string; question: string; verdict?: SectionVerdict; reason?: string; howHref: string }) {
  return (
    <header className="mb-8 grid gap-4 border-t hairline pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div>
        <p className="eyebrow mb-3"><span className="text-mint">0{n}</span> · {title}</p>
        <h2 className="display-m max-w-3xl text-balance">{question}</h2>
        {reason && <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-fg-2">{reason}</p>}
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        {verdict && <SectionBadge verdict={verdict} />}
        <Link href={howHref} className="text-xs text-muted hover:text-fg">How this is measured →</Link>
      </div>
    </header>
  );
}

export function EraTable({ eras }: { eras: EraResult[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Monthly activity of each era&apos;s contract relative to its peak</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-normal">Era and contract</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Peak month</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Latest month</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Kept of peak</th>
            <th scope="col" className="px-4 py-2.5 font-normal">Lasted?</th>
          </tr>
        </thead>
        <tbody>
          {eras.map((e) => (
            <tr key={e.id} className="border-t hairline align-top">
              <th scope="row" className="px-4 py-3 font-normal">
                <p className="font-[560] text-fg">{e.era}</p>
                <p className="num text-xs text-faint">{e.account} · {e.metric} · {e.sourceName}</p>
                <p className="num text-xs text-faint">exact data from {e.exactFrom ?? 'n/a'}{e.estimatedMonths.length ? ` (${e.estimatedMonths.length} months were estimates, excluded)` : ''}</p>
              </th>
              <td className="num px-4 py-3 text-right">{formatValue(e.peak, e.unit)}<p className="text-xs text-muted">{e.peakMonth ?? 'n/a'}</p></td>
              <td className="num px-4 py-3 text-right">{formatValue(e.latest, e.unit)}<p className="text-xs text-muted">{e.latestMonth ?? 'n/a'}</p></td>
              <td className="num px-4 py-3 text-right">{formatValue(e.retention, 'fraction')}</td>
              <td className="px-4 py-3">{e.lasted === null ? <span className="text-muted">Not yet judgeable</span> : e.lasted ? <span className="text-mint">Yes</span> : <span className="text-coral">No</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EraCharts({ eras }: { eras: EraResult[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {eras.map((e) => (
        <figure key={e.id} className="panel p-5">
          <p className="text-sm font-[600]">{e.era}</p>
          <p className="num mb-3 text-[0.6875rem] text-faint">{e.account} · {e.metric}</p>
          {e.months.length >= 3 ? (
            <EvidenceChart series={{ label: `${e.account} ${e.metric}`, unit: e.unit, aggregation: 'month', points: e.months.map(([m, v]) => [`${m}-01`, v]) }} source={e.sourceName} method={e.note} tone={e.lasted === false ? 'coral' : 'mint'} height={150} compact />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Fewer than three months of exact data.</p>
          )}
          <figcaption className="mt-3 text-xs leading-relaxed text-muted">{e.note}{e.estimatedMonths.length ? ` ${e.estimatedMonths.length} months (${e.estimatedMonths[0]} to ${e.estimatedMonths[e.estimatedMonths.length - 1]}) came back from NearBlocks as estimates rather than counts, so they are not shown or scored.` : ''}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function EventTable({ events }: { events: EventResult[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">Product adoption after each pivot’s mainnet launch, with chain-wide and market context</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-normal">Pivot</th>
            <th scope="col" className="px-4 py-2.5 font-normal">Product and mainnet launch</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Product activity, launch +2 months <span className="text-fg-2">(scored)</span></th>
            <th scope="col" className="px-4 py-2.5 font-normal">Adoption followed?</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Chain active accounts, +90d <span className="text-faint">(context)</span></th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">NEAR vs BTC, +90d <span className="text-faint">(context)</span></th>
          </tr>
        </thead>
        <tbody>
          {events.map((v) => (
            <tr key={v.id} className="border-t hairline align-top">
              <th scope="row" className="px-4 py-3 font-normal">
                <p className="font-[560] text-fg">{v.label}</p>
                <p className="text-xs text-muted">{v.shown} · <ExternalLink href={v.source} className="text-xs">source</ExternalLink></p>
              </th>
              <td className="px-4 py-3 text-xs">{v.productAccount ? <><span className="font-mono text-fg-2">{v.productAccount}</span><br /><span className="text-muted">{v.productLaunchShown}</span>{v.productLaunchSource && v.productLaunchSource !== v.source ? <> · <ExternalLink href={v.productLaunchSource} className="text-xs">source</ExternalLink></> : null}</> : <span className="text-muted">No single product contract</span>}</td>
              <td className="num px-4 py-3 text-right">{v.eraGrowth === null ? <span className="text-muted">n/a</span> : formatValue(v.eraGrowth, 'ratio')}</td>
              <td className="px-4 py-3">{v.adoptionFollowed === null ? <span className="text-muted">N/A, not counted</span> : v.adoptionFollowed ? <span className="text-mint">Yes</span> : <span className="text-coral">No</span>}</td>
              <td className="num px-4 py-3 text-right text-fg-2">{formatValue(v.daaChange, 'fraction', { signed: true })}</td>
              <td className="num px-4 py-3 text-right text-fg-2">{formatValue(v.relativeReturn90, 'fraction', { signed: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SupplyStats({ s }: { s: SupplyResult }) {
  const stats: [string, string, string][] = [
    ['Buyback revenue vs net new supply', formatValue(s.buybackCoverage, 'fraction'), 'Annualized buyback-designated revenue ÷ value of net new tokens'],
    ['Net new supply per year', formatValue(s.netNewAnnualPct, 'fraction'), `${formatValue(s.netNewAnnualUsd, 'USD')} at today's price, net of burns`],
    ['Buyback-designated revenue per year', formatValue(s.buybackAnnualUsd, 'USD'), 'DefiLlama classification; bought tokens are held, not burned'],
    ['Take rate (NEAR revenue ÷ volume)', formatValue(s.takeRate, 'fraction'), `Prior 90 days: ${formatValue(s.takeRatePrior, 'fraction')}`],
  ];
  return (
    <dl className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([k, v, note]) => (
        <div key={k} className="bg-surface p-5">
          <dt className="text-xs leading-snug text-muted">{k}</dt>
          <dd className="num mt-2 text-2xl text-fg">{v}</dd>
          <dd className="mt-1 text-xs leading-snug text-muted">{note}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TriggerTable({ triggers }: { triggers: TriggerResult[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Falsification triggers and their current status</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr><th scope="col" className="px-4 py-2.5 font-normal">Trigger</th><th scope="col" className="px-4 py-2.5 font-normal">Current reading</th><th scope="col" className="px-4 py-2.5 font-normal">Status</th></tr>
        </thead>
        <tbody>
          {triggers.map((t) => (
            <tr key={t.id} className="border-t hairline align-top">
              <td className="px-4 py-3"><p className="text-fg-2"><span className="num mr-2 text-faint">{t.id}</span>{t.statement}</p><p className="num mt-1 text-[0.6875rem] text-faint">{t.rule}</p></td>
              <td className="num px-4 py-3 text-xs text-fg-2">{t.observed}</td>
              <td className={`px-4 py-3 text-xs font-[600] ${t.status === 'TRIGGERED' ? 'text-coral' : t.status === 'UNKNOWN' ? 'text-amber' : 'text-mint'}`}>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AsOfLine({ newest, windowEnd }: { newest: string | null; windowEnd: string | null }) {
  return <p className="text-sm text-muted">Research snapshot from public sources{newest ? `; latest stored response ${formatDate(newest)}` : ''}{windowEnd ? `; 90-day window ends ${formatDate(windowEnd)}` : ''}.</p>;
}
