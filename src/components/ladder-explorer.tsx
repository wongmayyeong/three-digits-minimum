'use client';

/**
 * The price ladder, interactive: pick a price rung and a valuation, and see what it takes and which
 * conditions are observed today, assumed by the model, or still unproven. Pure display of the
 * deterministic ladder computed on the server.
 */
import { useState } from 'react';
import type { LadderResult, Status } from '@/lib/research/ladder';
import { formatValue } from '@/lib/format';

const STATUS: Record<Status, { label: string; cls: string; hint: string }> = {
  OBSERVED: { label: 'Observed', cls: 'border-mint/60 text-mint', hint: 'In today\'s data' },
  ASSUMED: { label: 'Assumed', cls: 'border-amber/60 text-amber', hint: 'A modelling choice' },
  UNPROVEN: { label: 'Unproven', cls: 'border-coral/60 text-coral', hint: 'Would have to happen' },
};
const BAND: Record<string, { label: string; cls: string }> = {
  holds: { label: 'Keeps today\'s size', cls: 'text-mint' },
  gains: { label: 'Grows up to 5x vs DEXs', cls: 'text-fg' },
  dominant: { label: 'Grows 5x to 10x vs DEXs', cls: 'text-amber' },
  beyond: { label: 'Needs 10x+ vs DEXs', cls: 'text-coral' },
};

export function LadderExplorer({ ladder }: { ladder: LadderResult }) {
  const [price, setPrice] = useState<number>(100);
  const [mk, setMk] = useState<string>('today');
  const rung = ladder.rungs.find((r) => r.price === price)!;
  const b = rung.byMultiple.find((x) => x.multipleKey === mk)!;
  const mult = ladder.multiples.find((m) => m.key === mk)!;

  return (
    <div className="panel overflow-hidden p-0">
      <div className="grid gap-px bg-line md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Rungs */}
        <div className="bg-surface p-4" role="radiogroup" aria-label="Price in ten years">
          <p className="eyebrow mb-3">Price in ten years</p>
          <div className="grid grid-cols-4 gap-2 md:flex md:flex-col-reverse">
            {ladder.rungs.map((r) => (
              <button key={r.price} type="button" role="radio" aria-checked={r.price === price} onClick={() => setPrice(r.price)}
                className={`flex min-w-0 items-baseline justify-center rounded-[var(--radius-md)] border px-2 py-2.5 text-left transition-colors md:justify-between md:px-3 ${r.price === price ? 'border-mint bg-mint/10' : 'border-line-strong hover:bg-white/5'}`}>
                <span className="num text-base font-[640] md:text-lg">${r.price}</span>
                <span className="num hidden text-xs text-muted md:inline">{formatValue(r.priceMultiple, 'ratio')}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">Today {formatValue(ladder.inputs.price, 'USD')}. Ten years, current 2.5% issuance.</p>
        </div>

        <div className="min-w-0 bg-surface p-5 md:p-6">
          {/* Valuation */}
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How the market values NEAR in 2036">
            {ladder.multiples.map((m) => (
              <button key={m.key} type="button" role="radio" aria-checked={m.key === mk} onClick={() => setMk(m.key)}
                className={`chip h-auto min-h-9 max-w-full whitespace-normal px-3 py-1.5 text-left ${m.key === mk ? 'border-mint text-mint' : ''}`}>
                {m.label} · {formatValue(m.value, 'ratio')}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Market cap divided by the value that reaches token holders (burns and buybacks). {mult.source}. Cash-flow framework only; platform valuations are shown separately.</p>

          {/* What it takes */}
          <dl className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius-md)] border hairline bg-line sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Market cap', formatValue(rung.marketCap, 'USD'), `Rank #${rung.rankToday ?? 'n/a'} among today's assets`],
              ['Value to holders needed', `${formatValue(b.requiredCapture, 'USD')}/yr`, `${formatValue(b.captureMultiple, 'ratio')} today's ${formatValue(ladder.inputs.captureToday, 'USD')}; ${formatValue(b.requiredIntentsCapture, 'USD')} of it from Intents`],
              ['Intents volume needed', `${formatValue(b.requiredVolume, 'USD')}/yr`, `${formatValue(b.volumeMultiple, 'ratio')} today's run rate`],
              ['Growth needed', `${b.requiredCagr === null ? 'n/a' : formatValue(b.requiredCagr, 'fraction')} a year`, `For ten years. Momentum today: ${formatValue(ladder.inputs.intentsYoY, 'fraction')} YoY`],
              ['Relative to 2036 spot DEX volume', formatValue(b.dexShare2036, 'fraction'), `Today ${formatValue(ladder.inputs.dexShareToday, 'fraction')} (run rate)`],
              ['Verdict for this rung', b.band ? BAND[b.band]!.label : 'n/a', b.shareMultiple === null ? '' : `${formatValue(b.shareMultiple, 'ratio')} today's size relative to spot DEX volume`],
            ].map(([k, v, note], i) => (
              <div key={k} className="bg-raised p-4">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className={`num mt-1 text-xl ${i === 5 && b.band ? BAND[b.band]!.cls : 'text-fg'}`}>{v}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted">{note}</dd>
              </div>
            ))}
          </dl>

          {/* What we can prove */}
          <h4 className="mt-6 text-sm font-[620]">What would have to be true, and what the evidence shows</h4>
          <ul className="mt-3 space-y-2">
            {b.conditions.map((c) => (
              <li key={c.text} className="flex gap-3 text-sm">
                <span className={`chip h-6 shrink-0 px-2 text-[0.6875rem] ${STATUS[c.status].cls}`} title={STATUS[c.status].hint}>{STATUS[c.status].label}</span>
                <span className="leading-snug"><span className="text-fg">{c.text}.</span> <span className="text-muted">{c.detail}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
