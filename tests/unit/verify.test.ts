import { describe, expect, it } from 'vitest';
import { extractNumbers, finalizeScores, verifyTurn, type SnapshotIndexItem } from '@/lib/ai/verify';
import { JudgeOutputSchema, TurnOutputSchema } from '@/lib/ai/schemas';

const snapshot: SnapshotIndexItem[] = [
  { evidenceId: 'INT-VOL-90D', value: 11_706_137_303, unit: 'USD', available: true, valueText: null },
  { evidenceId: 'INT-FEE-RATE', value: 0.0015239, unit: 'fraction', available: true, valueText: null },
  { evidenceId: 'MODEL-VOL-MULTIPLE-2PCT', value: 4.958, unit: 'ratio', available: true, valueText: null },
  { evidenceId: 'ACT-DAA-YOY', value: -0.771, unit: 'fraction', available: true, valueText: null },
  { evidenceId: 'INT-EXPLORER-TOP5-SHARE', value: null, unit: 'fraction', available: false, valueText: null },
  { evidenceId: 'INT-DEFINITIONS', value: null, unit: 'text', available: true, valueText: 'Revenue: 70% of every gas fee is burned' },
];

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
const ctx = { snapshot, metricKeyOf: (id: string) => `m.${id}`, claimPrefix: 'BO', opponentClaimIds: ['XO-1'], minWords: 20, maxWords: 180, requiresRebuttal: false };

function turn(claims: { id: string; evidenceIds: string[]; nature?: 'fact' | 'inference' | 'assumption'; rebuttedClaimId?: string | null }[], text: string) {
  return {
    beats: [{ text, claimId: claims[0]?.id ?? null }],
    claims: claims.map((c) => ({ id: c.id, text: 'claim', evidenceIds: c.evidenceIds, nature: c.nature ?? 'fact', rebuttedClaimId: c.rebuttedClaimId ?? null })),
    chartCue: null,
    modelInputRefs: [],
  };
}

describe('claim verification', () => {
  it('accepts valid citations and matching numbers', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['INT-VOL-90D'] }], `Intents did about $11.7 billion at a 0.15% fee rate, so volume must grow 4.96x. ${words(20)}`), ctx);
    expect(v.claims[0]!.status).toBe('supported');
    expect(v.claims[0]!.id).toBe('BO-1');
    expect(v.audit.unverifiedNumbers).toEqual([]);
    expect(v.audit.blocking).toEqual([]);
  });

  it('rejects evidence IDs absent from the snapshot', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['FAKE-ID', 'ALSO-FAKE'] }], words(40)), ctx);
    expect(v.claims[0]!.status).toBe('unsupported');
    expect(v.claims[0]!.evidenceIds).toEqual([]);
    expect(v.audit.invalidEvidenceIds).toEqual(['FAKE-ID', 'ALSO-FAKE']);
    expect(v.audit.blocking.join(' ')).toMatch(/Unknown evidence IDs/);
  });

  it('marks fact claims citing only unavailable evidence as unsupported', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['INT-EXPLORER-TOP5-SHARE'] }], words(40)), ctx);
    expect(v.claims[0]!.status).toBe('unsupported');
    expect(v.audit.unavailableCitations).toEqual(['INT-EXPLORER-TOP5-SHARE']);
  });

  it('flags invented numbers', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['INT-VOL-90D'] }], `Volume hit $25 billion and fees were 0.9% with 12.5x growth and 333,333 users. ${words(30)}`), ctx);
    expect(v.audit.unverifiedNumbers.length).toBeGreaterThanOrEqual(3);
    expect(v.audit.blocking.join(' ')).toMatch(/do not match any snapshot value/);
  });

  it('allows numbers quoted from evidence text, negative changes, and ignores years and small counts', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['INT-DEFINITIONS'] }], `In 2026, 70% of gas is burned, accounts fell 77.1%, over 3 to 5 years and 90 days. ${words(30)}`), ctx);
    expect(v.audit.unverifiedNumbers).toEqual([]);
  });

  it('drops rebuttal references to claims that do not exist', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['INT-VOL-90D'], rebuttedClaimId: 'XO-9' }], words(40)), ctx);
    expect(v.claims[0]!.rebuttedClaimId).toBeNull();
    expect(v.audit.invalidRebuttalRefs).toEqual(['XO-9']);
  });

  it('requires a rebuttal when the phase demands one', () => {
    const v = verifyTurn(turn([{ id: 'C1', evidenceIds: ['INT-VOL-90D'] }], words(40)), { ...ctx, requiresRebuttal: true });
    expect(v.audit.blocking.join(' ')).toMatch(/rebuts/);
  });

  it('extracts money, percent and multiples with scale words', () => {
    const n = extractNumbers('$11.7 billion, 2.2M NEAR, 0.15%, 4.96x and 80 percent');
    expect(n.map((x) => x.kind)).toEqual(['money', 'plain', 'percent', 'multiple', 'percent']);
    expect(n[0]!.value).toBeCloseTo(11.7e9);
    expect(n[1]!.value).toBeCloseTo(2.2e6);
  });
});

describe('schemas reject malformed or malicious payloads', () => {
  it('rejects turns with extra structure missing or too many claims', () => {
    expect(TurnOutputSchema.safeParse({ beats: [], claims: [], chartCue: null, modelInputRefs: [] }).success).toBe(false);
    expect(TurnOutputSchema.safeParse({ beats: [{ text: 'x', claimId: null }], claims: Array.from({ length: 5 }, (_, i) => ({ id: `C${i}`, text: 't', evidenceIds: [], nature: 'fact', rebuttedClaimId: null })), chartCue: null, modelInputRefs: [] }).success).toBe(false);
    expect(TurnOutputSchema.safeParse({ beats: [{ text: 'x', claimId: null }], claims: [{ id: 'C1', text: 't', evidenceIds: [], nature: 'prophecy', rebuttedClaimId: null }], chartCue: null, modelInputRefs: [] }).success).toBe(false);
    expect(TurnOutputSchema.safeParse({ beats: [{ text: 'x', claimId: null }], claims: [{ id: 'C1', text: 't', evidenceIds: [], nature: 'fact', rebuttedClaimId: null }], chartCue: null, modelInputRefs: ['rm -rf'] }).success).toBe(false);
  });

  it('rejects out-of-range judge scores', () => {
    const s = { evidenceAccuracy: 41, methodology: 10, rebuttals: 10, risks: 5, transparency: 5 };
    const ok = { evidenceAccuracy: 30, methodology: 10, rebuttals: 10, risks: 5, transparency: 5 };
    const base = { speech: 's', scores: { bull: ok, bear: ok }, scoreNotes: { bull: '', bear: '' }, winner: 'bull', decisiveEvidenceIds: [], unsupportedClaims: [], inputChallenges: [], verdictRationale: 'r', whatWouldChangeMyMind: ['x'], confidenceLabel: 'low' };
    expect(JudgeOutputSchema.safeParse(base).success).toBe(true);
    expect(JudgeOutputSchema.safeParse({ ...base, scores: { bull: s, bear: ok } }).success).toBe(false);
    expect(JudgeOutputSchema.safeParse({ ...base, winner: 'NEAR to $100' }).success).toBe(false);
  });
});

describe('deterministic scoring override', () => {
  const s = { evidenceAccuracy: 34, methodology: 15, rebuttals: 15, risks: 8, transparency: 8 };
  const clean = { wordCount: 150, withinLength: true, invalidEvidenceIds: [], unavailableCitations: [], numbers: [], unverifiedNumbers: [], invalidRebuttalRefs: [], problems: [], blocking: [] };
  it('penalizes unsupported claims and overrides a contradicted winner', () => {
    const r = finalizeScores({ bull: s, bear: { ...s, evidenceAccuracy: 30 } }, 'bull', [
      { side: 'bull', audit: { ...clean, unverifiedNumbers: ['$9B', '12%'], invalidEvidenceIds: ['X'] }, claims: [{ id: 'BO-1', text: '', evidenceIds: [], metricKeys: [], nature: 'fact', rebuttedClaimId: null, status: 'unsupported', problems: [] }] },
      { side: 'bear', audit: clean, claims: [] },
    ]);
    expect(r.penalties.find((p) => p.side === 'bull')!.points).toBe(4 + 4 + 3);
    expect(r.scores.bull.evidenceAccuracy).toBe(23);
    expect(r.scores.bull.total).toBe(23 + 15 + 15 + 8 + 8);
    expect(r.winner).toBe('bear');
    expect(r.overrideReason).toMatch(/contradicts/);
  });

  it('keeps the judge pick when totals agree and allows inconclusive', () => {
    expect(finalizeScores({ bull: s, bear: s }, 'inconclusive', []).winner).toBe('inconclusive');
    expect(finalizeScores({ bull: s, bear: { ...s, rebuttals: 5 } }, 'bull', []).overrideReason).toBeNull();
  });
});
