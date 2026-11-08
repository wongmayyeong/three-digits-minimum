'use client';

/**
 * Interactive buyback demand target calculator. Uses the same pure functions as the server. Any input
 * the user edits is relabelled ASSUMED, because it no longer matches the evidence.
 */
import { useMemo, useState } from 'react';
import { computeModel, requiredFactor, requiredTakeRate, type InputKind, type ModelInputs } from '@/lib/research/model';
import { formatValue } from '@/lib/format';

type Key = keyof ModelInputs;
const META: Record<Key, { label: string; unit: 'USD' | 'fraction'; step: number; help: string }> = {
  M: { label: 'Circulating market cap (M)', unit: 'USD', step: 1e8, help: 'CoinGecko circulating market cap.' },
  V: { label: 'Annualized Intents volume (V)', unit: 'USD', step: 1e9, help: 'Trailing 90-day DefiLlama volume x 365/90.' },
  f: { label: 'Effective fee rate (f)', unit: 'fraction', step: 0.0001, help: 'Gross fees / volume, same window.' },
  c: { label: 'Protocol capture (c)', unit: 'fraction', step: 0.01, help: 'NEAR-captured revenue / gross fees.' },
  b: { label: 'Buyback share (b)', unit: 'fraction', step: 0.05, help: 'Share of captured revenue used for buybacks.' },
  y: { label: 'Target buyback / market cap (y)', unit: 'fraction', step: 0.005, help: 'A hypothetical target, not a policy.' },
};

export function Calculator({ base, asOf }: { base: ModelInputs | null; asOf: string | null }) {
  const initial: Record<Key, { value: number | null; kind: InputKind }> = useMemo(() => {
    const o = {} as Record<Key, { value: number | null; kind: InputKind }>;
    for (const k of Object.keys(META) as Key[]) o[k] = { value: base?.[k]?.value ?? (k === 'y' ? 0.02 : null), kind: base?.[k]?.kind ?? 'ASSUMED' };
    return o;
  }, [base]);
  const [vals, setVals] = useState(initial);
  const [solveFor, setSolveFor] = useState<'f' | 'c' | 'b'>('b');

  const inputs: ModelInputs = Object.fromEntries((Object.keys(META) as Key[]).map((k) => [k, { value: vals[k].value, kind: vals[k].kind, evidenceIds: [] }])) as unknown as ModelInputs;
  const out = computeModel(inputs);
  const req = requiredTakeRate(vals.V.value, vals.M.value, vals.y.value);
  const reqFactor = requiredFactor(solveFor, { V: vals.V.value, M: vals.M.value, y: vals.y.value, f: vals.f.value, c: vals.c.value, b: vals.b.value });

  const edit = (k: Key, raw: string) => {
    const scaled = raw.trim() === '' ? null : Number(raw) / (META[k].unit === 'fraction' ? 100 : 1);
    setVals((v) => ({ ...v, [k]: { value: scaled !== null && Number.isFinite(scaled) ? scaled : null, kind: 'ASSUMED' } }));
  };
  const naNote = (k: keyof typeof out.na) => out.na[k]?.map((r) => `${r.input} ${r.code === 'missing' ? 'missing' : r.code === 'nonpositive' ? 'must be positive' : 'must be at most 100%'}`).join(', ');

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <fieldset className="panel p-5">
        <legend className="sr-only">Model inputs</legend>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="eyebrow">Inputs</p>
          <button type="button" className="link text-xs" onClick={() => setVals(initial)}>Reset to measured values{asOf ? ` (${asOf})` : ''}</button>
        </div>
        <div className="space-y-4">
          {(Object.keys(META) as Key[]).map((k) => {
            const m = META[k];
            const v = vals[k].value;
            const display = v === null ? '' : m.unit === 'fraction' ? String(Number((v * 100).toPrecision(6))) : String(Math.round(v));
            return (
              <div key={k} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`in-${k}`} className="text-sm text-fg-2">{m.label}</label>
                  <span className={`chip ${vals[k].kind === 'ASSUMED' ? 'border-[rgb(255_121_102/0.45)] text-coral' : vals[k].kind === 'OBSERVED' ? 'border-[rgb(0_236_151/0.45)] text-mint' : ''}`}>{vals[k].kind}</span>
                </div>
                <div className="flex items-center gap-2">
                  {m.unit === 'USD' && <span className="text-sm text-muted">$</span>}
                  <input id={`in-${k}`} inputMode="decimal" type="number" step={m.unit === 'fraction' ? m.step * 100 : m.step} min={0} value={display} onChange={(e) => edit(k, e.target.value)}
                    className="num h-10 w-full rounded-[var(--radius-sm)] border border-line-strong bg-bg px-3 text-sm text-fg" aria-describedby={`h-${k}`} />
                  {m.unit === 'fraction' && <span className="text-sm text-muted">%</span>}
                </div>
                <p id={`h-${k}`} className="text-xs text-muted">{m.help} {v !== null && m.unit === 'USD' ? `(${formatValue(v, 'USD')})` : ''}</p>
              </div>
            );
          })}
        </div>
      </fieldset>
      <div className="space-y-4">
        <div className="panel p-5" aria-live="polite">
          <p className="eyebrow">Results</p>
          <dl className="mt-4 space-y-4">
            {[
              ['Annual buyback demand', 'V × f × c × b', out.annualBuybackDemandUsd, 'USD', 'annualBuybackDemandUsd'],
              ['Buyback demand / market cap', '(V × f × c × b) ÷ M', out.buybackDemandToMcap, 'fraction', 'buybackDemandToMcap'],
              ['Annual volume needed for target y', '(y × M) ÷ (f × c × b)', out.breakEvenAnnualVolumeUsd, 'USD', 'breakEvenAnnualVolumeUsd'],
              ['Volume multiple required', 'required volume ÷ V', out.volumeMultipleRequired, 'ratio', 'volumeMultipleRequired'],
            ].map(([label, formula, value, unit, key]) => (
              <div key={label as string} className="flex items-baseline justify-between gap-4 border-b hairline pb-3">
                <dt><p className="text-sm text-fg-2">{label as string}</p><p className="num text-[0.6875rem] text-faint">{formula as string}</p></dt>
                <dd className="text-right"><p className="num text-xl">{formatValue(value as number | null, unit as string)}</p>{value === null && <p className="text-[0.6875rem] text-coral">N/A: {naNote(key as keyof typeof out.na)}</p>}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="panel p-5">
          <p className="eyebrow">Reverse calculator</p>
          <p className="mt-3 text-sm leading-relaxed text-fg-2">At this volume and market cap, reaching y needs <span className="num text-fg">{formatValue(req, 'fraction')}</span> of every volume dollar to become buybacks (f × c × b). Today that share is <span className="num text-fg">{formatValue(out.volumeToBuybackRate, 'fraction')}</span>.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="solve" className="text-muted">Holding the other two fixed, required</label>
            <select id="solve" value={solveFor} onChange={(e) => setSolveFor(e.target.value as 'f' | 'c' | 'b')} className="h-9 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-2 text-sm">
              <option value="f">fee rate f</option><option value="c">capture c</option><option value="b">buyback share b</option>
            </select>
            <span className="num text-fg">= {formatValue(reqFactor, 'fraction')}</span>
          </div>
          {reqFactor !== null && reqFactor > 1 && <p className="mt-2 text-xs text-coral">Above 100%: no value of this factor alone can reach the target at this volume.</p>}
          <p className="mt-3 text-xs text-muted">A requirement, not an observation. Buybacks acquire tokens that may be held rather than burned, and do not raise price one-for-one.</p>
        </div>
      </div>
    </div>
  );
}
