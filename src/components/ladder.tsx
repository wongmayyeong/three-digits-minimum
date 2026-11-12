/** Static ladder tables: the summary grid, the scenario matrix, valuation regimes, platform needs and checkpoints. */
import type { LadderResult } from '@/lib/research/ladder';
import { GROWTH_SCENARIOS } from '@/lib/research/ladder';
import { formatValue } from '@/lib/format';

const BAND_CLS: Record<string, string> = { holds: 'text-mint', gains: 'text-fg', dominant: 'text-amber', beyond: 'text-coral' };
const BAND_LABEL: Record<string, string> = { holds: 'keeps today\'s size', gains: 'up to 5x today', dominant: '5x to 10x today', beyond: 'more than 10x today' };

export function LadderGrid({ ladder }: { ladder: LadderResult }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">NEAR Intents volume needed in 2036 relative to spot DEX volume, by price and cash-flow multiple</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-normal">Price in ten years</th>
            {ladder.multiples.map((m) => <th key={m.key} scope="col" className="px-4 py-2.5 text-right font-normal">{m.label}<br /><span className="num text-faint">{formatValue(m.value, 'ratio')}</span></th>)}
          </tr>
        </thead>
        <tbody>
          {[...ladder.rungs].reverse().map((r) => (
            <tr key={r.price} className="border-t hairline">
              <th scope="row" className="px-4 py-3 font-normal">
                <span className="num text-base font-[640]">${r.price}</span> <span className="num text-xs text-muted">{formatValue(r.priceMultiple, 'ratio')} · {formatValue(r.marketCap, 'USD')} · #{r.rankToday}</span>
              </th>
              {r.byMultiple.map((b) => (
                <td key={b.multipleKey} className="px-4 py-3 text-right">
                  <span className={`num ${BAND_CLS[b.band ?? ''] ?? ''}`}>{formatValue(b.dexShare2036, 'fraction')}</span>
                  <span className="block text-[0.6875rem] text-muted">{b.band ? BAND_LABEL[b.band] : 'n/a'}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImpliedMatrix({ ladder }: { ladder: LadderResult }) {
  const p0 = ladder.inputs.price ?? 0;
  const tone = (px: number | null) => (px === null ? '' : px >= 100 ? 'text-mint' : px >= 25 ? 'text-fg' : px >= p0 ? 'text-fg-2' : 'text-coral');
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">Implied NEAR price in 2036 under growth scenarios and valuation multiples</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-normal">Intents growth to 2036</th>
            {ladder.multiples.map((m) => <th key={m.key} scope="col" className="px-4 py-2.5 text-right font-normal">{m.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {ladder.implied.map((g) => {
            const s = GROWTH_SCENARIOS.find((x) => x.key === g.growthKey)!;
            return (
              <tr key={g.growthKey} className="border-t hairline align-top">
                <th scope="row" className="px-4 py-3 font-normal"><span className="font-[600]">{s.label}: {formatValue(s.cagr, 'fraction')} a year</span><p className="text-xs text-muted">{s.note}</p></th>
                {g.byMultiple.map((b) => (
                  <td key={b.multipleKey} className="px-4 py-3 text-right">
                    <span className={`num text-base ${tone(b.price)}`}>{formatValue(b.price, 'USD')}</span>
                    <span className="block text-[0.6875rem] text-muted">{formatValue(b.multipleOfToday, 'ratio')} today</span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ValuationRegimes({ ladder }: { ladder: LadderResult }) {
  const nearM = ladder.multiples.find((m) => m.key === 'today');
  const rows = [...ladder.peers, { label: 'NEAR (gas burned + Intents buybacks)', regime: 'today', marketCap: ladder.inputs.marketCap, holdersRevenueRunRate: ladder.inputs.captureToday, holdersRevenue365: ladder.inputs.capture365, multiple: nearM?.value ?? null, multiple365: nearM?.value365 ?? null }];
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">Market cap relative to value reaching token holders, every asset on the same basis</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr><th className="px-4 py-2.5 font-normal">Token</th><th className="px-4 py-2.5 font-normal">How it is valued</th><th className="px-4 py-2.5 text-right font-normal">Market cap</th><th className="px-4 py-2.5 text-right font-normal">To holders a year ({ladder.basis.runRateDays}-day run rate)</th><th className="px-4 py-2.5 text-right font-normal">Multiple</th><th className="px-4 py-2.5 text-right font-normal">Multiple, trailing year</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={`border-t hairline ${r.regime === 'today' ? 'bg-mint/5' : ''}`}>
              <th scope="row" className="px-4 py-3 font-[560]">{r.label}</th>
              <td className="px-4 py-3 text-xs text-muted">{r.regime === 'platform' ? 'Platform (on-chain economy)' : r.regime === 'cash-flow' ? 'Cash flow' : 'Both tested here'}</td>
              <td className="num px-4 py-3 text-right">{formatValue(r.marketCap, 'USD')}</td>
              <td className="num px-4 py-3 text-right">{formatValue(r.holdersRevenueRunRate, 'USD')}</td>
              <td className="num px-4 py-3 text-right font-[600]">{formatValue(r.multiple, 'ratio')}</td>
              <td className="num px-4 py-3 text-right text-muted">{formatValue(r.multiple365, 'ratio')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlatformNeeds({ ladder }: { ladder: LadderResult }) {
  const near = ladder.platform.find((p) => p.chain === 'Near');
  const name = (b: string) => (b === 'BSC' ? 'BNB Chain' : b);
  const rows = ladder.platform.filter((p) => p.chain !== 'Near').flatMap((p) => ([
    { key: `${p.chain}-st`, label: name(p.chain), metric: 'Stablecoins', ratio: p.capToStablecoins, get: (r: LadderResult['rungs'][number]) => r.platform.find((x) => x.benchmark === p.chain), field: 'stablecoins' as const, mult: 'stablecoinsMultiple' as const },
    { key: `${p.chain}-tvl`, label: name(p.chain), metric: 'DeFi TVL', ratio: p.capToTvl, get: (r: LadderResult['rungs'][number]) => r.platform.find((x) => x.benchmark === p.chain), field: 'tvl' as const, mult: 'tvlMultiple' as const },
  ]));
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Platform framework: the on-chain economy each rung would need to be valued like a top platform</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr><th className="px-4 py-2.5 font-normal">Valued like</th><th className="px-4 py-2.5 font-normal">On NEAR</th><th className="px-4 py-2.5 text-right font-normal">Market cap ratio</th>{ladder.rungs.map((r) => <th key={r.price} className="num px-4 py-2.5 text-right font-normal">${r.price}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t hairline">
              <th scope="row" className="px-4 py-3 font-[560]">{row.label}</th>
              <td className="px-4 py-3 text-xs text-muted">{row.metric}</td>
              <td className="num px-4 py-3 text-right text-muted">{formatValue(row.ratio, 'ratio')}</td>
              {ladder.rungs.map((r) => { const x = row.get(r); return (
                <td key={r.price} className="num px-4 py-3 text-right">{formatValue(x?.[row.field] ?? null, 'USD')}<span className="block text-[0.6875rem] text-coral">{formatValue(x?.[row.mult] ?? null, 'ratio')} today</span></td>
              ); })}
            </tr>
          ))}
          <tr className="border-t hairline bg-raised/50">
            <th scope="row" className="px-4 py-3 font-normal text-muted" colSpan={3}>NEAR today</th>
            <td className="num px-4 py-3 text-right text-xs text-muted" colSpan={ladder.rungs.length}>Stablecoins {formatValue(near?.stablecoins ?? null, 'USD')} · DeFi TVL {formatValue(near?.tvl ?? null, 'USD')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function CheckpointTable({ ladder }: { ladder: LadderResult }) {
  const rows = ladder.checkpoints.filter((c) => c.years.length);
  const years = rows[0]?.years.map((y) => y.year) ?? [];
  const pick = years.filter((_, i) => i % 2 === 0 || i === years.length - 1);
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">NEAR Intents annual volume needed each year, at NEAR&apos;s own multiple today</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr><th className="px-4 py-2.5 font-normal">Rung</th>{pick.map((y) => <th key={y} className="num px-4 py-2.5 text-right font-normal">{y}</th>)}</tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((c) => (
            <tr key={c.price} className="border-t hairline">
              <th scope="row" className="num px-4 py-3 font-[600]">${c.price}</th>
              {pick.map((y) => <td key={y} className="num px-4 py-3 text-right">{formatValue(c.years.find((x) => x.year === y)?.volume ?? null, 'USD')}</td>)}
            </tr>
          ))}
          <tr className="border-t hairline bg-raised/50"><th scope="row" className="px-4 py-3 text-xs font-normal text-muted">Today (run rate)</th><td className="num px-4 py-3 text-right text-muted" colSpan={pick.length}>{formatValue(ladder.inputs.intentsRunRate, 'USD')} a year</td></tr>
        </tbody>
      </table>
    </div>
  );
}
