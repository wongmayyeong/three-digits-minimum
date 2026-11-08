/**
 * Falsification triggers for the overarching thesis ("NEAR is a credible long-term investment
 * because measurable activity accrues to the token"). Each rule is fixed in code, evaluated
 * deterministically against the evidence, and reported as TRIGGERED, NOT TRIGGERED or UNKNOWN.
 *
 * Disclosure: thresholds were written while building the pipeline, after the author had seen
 * some raw values. They are not a blind pre-registration. Change them here and re-run
 * `npm run research:rebuild` to see the effect.
 */
import { formatValue } from '@/lib/format';
import type { EvidenceDraft } from './types';

export type TriggerStatus = 'TRIGGERED' | 'NOT TRIGGERED' | 'UNKNOWN';

export interface TriggerResult {
  id: string;
  statement: string;
  rule: string;
  evidenceIds: string[];
  status: TriggerStatus;
  observed: string;
  implication: string;
}

type Get = (id: string) => number | null;

interface TriggerDef {
  id: string;
  statement: string;
  rule: string;
  evidenceIds: string[];
  evaluate: (g: Get) => { status: TriggerStatus; observed: string };
  implication: string;
}

const fmt = (v: number | null, u: string) => formatValue(v, u);

export const TRIGGERS: TriggerDef[] = [
  {
    id: 'F1', statement: 'Intents volume grows but NEAR-captured revenue per dollar of volume falls.',
    rule: 'INT-VOL-GROWTH > 0 and INT-TAKE-RATE < 0.8 x INT-TAKE-RATE-PRIOR',
    evidenceIds: ['INT-VOL-GROWTH', 'INT-TAKE-RATE', 'INT-TAKE-RATE-PRIOR'],
    evaluate: (g) => {
      const gr = g('INT-VOL-GROWTH'); const t = g('INT-TAKE-RATE'); const tp = g('INT-TAKE-RATE-PRIOR');
      if (gr === null || t === null || tp === null) return { status: 'UNKNOWN', observed: 'inputs unavailable' };
      return { status: gr > 0 && t < 0.8 * tp ? 'TRIGGERED' : 'NOT TRIGGERED', observed: `volume ${fmt(gr, 'fraction')}; take rate ${fmt(tp, 'fraction')} -> ${fmt(t, 'fraction')}` };
    },
    implication: 'Activity is not converting into token-level value at a stable rate.',
  },
  {
    id: 'F2', statement: 'Fee compression: the effective fee rate drops by a quarter or more between consecutive 90-day windows.',
    rule: 'INT-FEE-RATE < 0.75 x INT-FEE-RATE-PRIOR',
    evidenceIds: ['INT-FEE-RATE', 'INT-FEE-RATE-PRIOR'],
    evaluate: (g) => {
      const f = g('INT-FEE-RATE'); const fp = g('INT-FEE-RATE-PRIOR');
      if (f === null || fp === null) return { status: 'UNKNOWN', observed: 'inputs unavailable' };
      return { status: f < 0.75 * fp ? 'TRIGGERED' : 'NOT TRIGGERED', observed: `${fmt(fp, 'fraction')} -> ${fmt(f, 'fraction')}` };
    },
    implication: 'Competition is pricing intents settlement toward zero faster than volume grows.',
  },
  {
    id: 'F3', statement: 'The volume needed for buyback revenue worth 2% of market cap is more than ten times today\'s run rate.',
    rule: 'MODEL-VOL-MULTIPLE-2PCT > 10',
    evidenceIds: ['MODEL-VOL-MULTIPLE-2PCT'],
    evaluate: (g) => {
      const m = g('MODEL-VOL-MULTIPLE-2PCT');
      if (m === null) return { status: 'UNKNOWN', observed: 'model N/A' };
      return { status: m > 10 ? 'TRIGGERED' : 'NOT TRIGGERED', observed: `${fmt(m, 'ratio')} today's run rate` };
    },
    implication: 'Buybacks cannot be material to valuation on any plausible near-term growth path.',
  },
  {
    id: 'F4', statement: 'Base-layer user activity contracts sharply year over year.',
    rule: 'ACT-DAA-YOY < -25%',
    evidenceIds: ['ACT-DAA-YOY'],
    evaluate: (g) => {
      const d = g('ACT-DAA-YOY');
      if (d === null) return { status: 'UNKNOWN', observed: 'input unavailable' };
      return { status: d < -0.25 ? 'TRIGGERED' : 'NOT TRIGGERED', observed: `${fmt(d, 'fraction')} vs a year earlier` };
    },
    implication: 'Direct chain usage is shrinking; the thesis must rest on cross-chain activity rather than NEAR-native users. Accounts are not people, so this may partly reflect less automation.',
  },
  {
    id: 'F5', statement: 'DeFi deposits on NEAR halve year over year.',
    rule: 'DEFI-TVL-NEAR-YOY < -50%',
    evidenceIds: ['DEFI-TVL-NEAR-YOY'],
    evaluate: (g) => {
      const d = g('DEFI-TVL-NEAR-YOY');
      if (d === null) return { status: 'UNKNOWN', observed: 'input unavailable' };
      return { status: d < -0.5 ? 'TRIGGERED' : 'NOT TRIGGERED', observed: `${fmt(d, 'fraction')} vs a year earlier` };
    },
    implication: 'Liquidity is leaving as incentives fade; DeFi activity is not self-sustaining.',
  },
  {
    id: 'F6', statement: 'Token-level value capture is under 1% of market cap per year.',
    rule: 'VAL-NEAR-VALUE-CAPTURE-ANN / MKT-NEAR-MCAP < 1%',
    evidenceIds: ['VAL-NEAR-VALUE-CAPTURE-ANN', 'MKT-NEAR-MCAP'],
    evaluate: (g) => {
      const v = g('VAL-NEAR-VALUE-CAPTURE-ANN'); const m = g('MKT-NEAR-MCAP');
      if (v === null || m === null || m === 0) return { status: 'UNKNOWN', observed: 'inputs unavailable' };
      const r = v / m;
      return { status: r < 0.01 ? 'TRIGGERED' : 'NOT TRIGGERED', observed: `${fmt(r, 'fraction')} of market cap` };
    },
    implication: 'Burns plus buybacks are too small to be a primary valuation support today; the investment case depends on growth not yet measured.',
  },
];

export function evaluateTriggers(evidence: Pick<EvidenceDraft, 'evidenceId' | 'value' | 'available'>[]): TriggerResult[] {
  const get: Get = (id) => {
    const e = evidence.find((x) => x.evidenceId === id);
    return e && e.available ? e.value : null;
  };
  return TRIGGERS.map((t) => {
    const r = t.evaluate(get);
    return { id: t.id, statement: t.statement, rule: t.rule, evidenceIds: t.evidenceIds, implication: t.implication, ...r };
  });
}
