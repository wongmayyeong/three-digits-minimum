/**
 * LOCAL TESTING ONLY. A deterministic stand-in for an LLM so the pipeline (validation,
 * persistence, audio, replay) can be exercised without credentials. It writes plainly
 * templated text from real snapshot values. Sessions using it are flagged `synthetic`,
 * labelled SYNTHETIC TEST RUN in the UI, excluded from the public library, and the provider
 * refuses to load when NODE_ENV=production.
 */
import { formatValue } from '@/lib/format';
import type { LlmProvider, StructuredRequest, StructuredResult } from './provider';
import type { PromptEvidence } from './prompts';

export interface FixtureContext {
  kind: 'turn' | 'judge';
  actor: 'bull' | 'bear' | 'judge';
  phase: string;
  evidence: PromptEvidence[];
  opponentClaimIds: string[];
  allClaimIds: string[];
}

const BULL_PREF = ['INT-VOL-GROWTH', 'INT-VOL-90D', 'INT-REV-ANN', 'INT-CAPTURE', 'MODEL-BUYBACK-USD', 'DEFI-TVL-NEAR-YOY', 'DEFI-STABLES-NEAR', 'INT-FEE-RATE', 'ONC-BUYBACK-WALLET'];
const BEAR_PREF = ['MODEL-BUYBACK-TO-MCAP', 'MODEL-VOL-MULTIPLE-2PCT', 'ACT-DAA-YOY', 'INT-CAPTURE', 'ONC-ISSUANCE-USD', 'PEER-NEAR-MCAP-TO-FEES', 'INT-BUYBACK-SHARE', 'ONC-BUYBACK-PCT-SUPPLY', 'VAL-NEAR-MCAP-TO-CAPTURE'];

export class FixtureProvider implements LlmProvider {
  id = 'fixture';
  model = 'synthetic-fixture';
  pricing = { inputPerM: 0, outputPerM: 0 };

  constructor() {
    if (process.env.NODE_ENV === 'production') throw new Error('The fixture provider cannot run in production.');
  }

  async generate(req: StructuredRequest & { context?: FixtureContext }): Promise<StructuredResult> {
    const ctx = req.context;
    if (!ctx) throw new Error('fixture provider requires context');
    const avail = ctx.evidence.filter((e) => e.available && e.value !== null);
    const pick = (prefs: string[], offset: number) => {
      const ordered = [...prefs.map((p) => avail.find((e) => e.id === p)).filter(Boolean), ...avail] as PromptEvidence[];
      const uniq = [...new Map(ordered.map((e) => [e.id, e])).values()];
      return uniq.slice(offset, offset + 3);
    };
    const offset = ['BULL_OPEN', 'BEAR_OPEN'].includes(ctx.phase) ? 0 : ['BULL_REBUTTAL', 'BEAR_REBUTTAL'].includes(ctx.phase) ? 2 : 4;
    let json: unknown;
    if (ctx.kind === 'turn') {
      const ev = pick(ctx.actor === 'bull' ? BULL_PREF : BEAR_PREF, offset);
      const side = ctx.actor === 'bull' ? 'supports the Bull case' : 'weakens the Bull case';
      const claims = ev.map((e, i) => ({
        id: `C${i + 1}`, text: `${e.label} is ${formatValue(e.value, e.unit)} (${e.period}), which ${side}.`, evidenceIds: [e.id], nature: 'fact',
        rebuttedClaimId: i === 0 && ctx.opponentClaimIds.length ? ctx.opponentClaimIds[ctx.opponentClaimIds.length - 1]! : null,
      }));
      const beats = [
        { text: 'This is a synthetic test turn generated from a fixed template, not an AI argument.', claimId: null },
        ...claims.map((c) => ({ text: `${c.text} The figure comes from the frozen snapshot and its source is linked on screen, with the measurement window stated alongside it so the comparison can be checked.`, claimId: c.id })),
        { text: 'The template repeats this structure for every turn so the audit, audio and replay paths can be tested end to end without calling a language model.', claimId: null },
      ];
      json = { beats, claims, chartCue: ev[0] ? { evidenceId: ev[0].id, chartType: 'stat' } : null, modelInputRefs: ['V', 'f'] };
    } else {
      const s = { evidenceAccuracy: 30, methodology: 14, rebuttals: 12, risks: 7, transparency: 7 };
      json = {
        speech: 'This is a synthetic test verdict generated from a fixed template. No language model reviewed this debate. Both sides cited evidence from the frozen snapshot, and every citation was checked by the server audit. Because this run exists only to test the pipeline, the verdict is recorded as inconclusive. A real verdict weighs which side used the evidence more accurately, engaged the strongest opposing claims, and labelled its assumptions honestly. Replay, report and audio paths can now be checked against this stored result without any new data fetch or model call.',
        scores: { bull: s, bear: s },
        scoreNotes: { bull: 'Synthetic fixture score.', bear: 'Synthetic fixture score.' },
        winner: 'inconclusive',
        decisiveEvidenceIds: avail.slice(0, 2).map((e) => e.id),
        unsupportedClaims: [],
        inputChallenges: [{ input: 'b', challenge: 'Synthetic note: the buyback share is a classification, not a guaranteed policy.' }],
        verdictRationale: 'Synthetic fixture verdict for pipeline testing.',
        whatWouldChangeMyMind: ['Synthetic fixture: not a real judgement.'],
        confidenceLabel: 'low',
      };
    }
    const text = JSON.stringify(json);
    return { json, rawText: text, model: this.model, inputTokens: 0, outputTokens: 0, latencyMs: 5 };
  }
}
