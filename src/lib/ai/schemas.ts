/**
 * Structured-output contracts for Bull, Bear and Judge. Each contract exists twice:
 * a strict JSON Schema sent to the model provider, and a Zod schema the server uses to
 * validate whatever comes back. Provider output is never trusted without the Zod pass.
 */
import { z } from 'zod';

export const MODEL_INPUT_KEYS = ['M', 'V', 'f', 'c', 'b', 'y'] as const;
export const CHART_TYPES = ['line', 'bar', 'stat', 'comparison'] as const;

const id = z.string().min(1).max(64);

export const TurnOutputSchema = z.object({
  beats: z.array(z.object({ text: z.string().min(1).max(700), claimId: id.nullable() })).min(1).max(10),
  claims: z.array(z.object({
    id,
    text: z.string().min(1).max(400),
    evidenceIds: z.array(id).max(6),
    nature: z.enum(['fact', 'inference', 'assumption']),
    rebuttedClaimId: id.nullable(),
  })).min(1).max(4),
  chartCue: z.object({ evidenceId: id, chartType: z.enum(CHART_TYPES) }).nullable(),
  modelInputRefs: z.array(z.enum(MODEL_INPUT_KEYS)).max(6),
});
export type TurnOutput = z.infer<typeof TurnOutputSchema>;

const scoreBlock = z.object({
  evidenceAccuracy: z.number().min(0).max(40),
  methodology: z.number().min(0).max(20),
  rebuttals: z.number().min(0).max(20),
  risks: z.number().min(0).max(10),
  transparency: z.number().min(0).max(10),
});
export type ScoreBlock = z.infer<typeof scoreBlock>;

export const JudgeOutputSchema = z.object({
  speech: z.string().min(1).max(2000),
  scores: z.object({ bull: scoreBlock, bear: scoreBlock }),
  scoreNotes: z.object({ bull: z.string().max(500), bear: z.string().max(500) }),
  winner: z.enum(['bull', 'bear', 'inconclusive']),
  decisiveEvidenceIds: z.array(id).max(6),
  unsupportedClaims: z.array(z.object({ claimId: id, reason: z.string().max(300) })).max(12),
  inputChallenges: z.array(z.object({ input: z.enum(MODEL_INPUT_KEYS), challenge: z.string().max(400) })).max(6),
  verdictRationale: z.string().min(1).max(1500),
  whatWouldChangeMyMind: z.array(z.string().min(1).max(300)).min(1).max(5),
  confidenceLabel: z.enum(['low', 'moderate', 'high']),
});
export type JudgeOutput = z.infer<typeof JudgeOutputSchema>;

/**
 * Trims a verdict's list lengths and note lengths to the display limits before validation. Strict JSON Schema
 * cannot cap array sizes, and an over-long list is not a reason to throw away an otherwise valid verdict.
 * Scores, the winner and the speech are never altered.
 */
export function clampJudgeOutput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const j = { ...(raw as Record<string, unknown>) };
  const cut = (v: unknown, n: number) => (typeof v === 'string' && v.length > n ? `${v.slice(0, n - 1).trimEnd()}…` : v);
  const list = <T>(v: unknown, n: number, map: (x: T) => T = (x) => x) => (Array.isArray(v) ? (v as T[]).slice(0, n).map(map) : v);
  j.decisiveEvidenceIds = list(j.decisiveEvidenceIds, 6);
  j.unsupportedClaims = list<Record<string, unknown>>(j.unsupportedClaims, 12, (u) => ({ ...u, reason: cut(u?.reason, 300) }));
  j.inputChallenges = list<Record<string, unknown>>(j.inputChallenges, 6, (c) => ({ ...c, challenge: cut(c?.challenge, 400) }));
  j.whatWouldChangeMyMind = list<unknown>(j.whatWouldChangeMyMind, 5, (w) => cut(w, 300));
  if (j.scoreNotes && typeof j.scoreNotes === 'object') {
    const n = j.scoreNotes as Record<string, unknown>;
    j.scoreNotes = { ...n, bull: cut(n.bull, 500), bear: cut(n.bear, 500) };
  }
  j.verdictRationale = cut(j.verdictRationale, 1500);
  return j;
}

// ---------------------------------------------------------------- JSON Schemas (strict mode)

const str = { type: 'string' } as const;
const nullableStr = { type: ['string', 'null'] } as const;
const strArr = { type: 'array', items: str } as const;
const obj = (properties: Record<string, unknown>) => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) });

export const TurnJsonSchema = obj({
  beats: {
    type: 'array',
    description: 'The spoken turn split into consecutive sentences or short sentence groups. Each beat that makes a claim names that claim id.',
    items: obj({ text: str, claimId: nullableStr }),
  },
  claims: {
    type: 'array',
    description: 'At most 4 salient claims made in this turn.',
    items: obj({
      id: { type: 'string', description: 'Local id such as C1, C2.' },
      text: { type: 'string', description: 'One-sentence statement of the claim.' },
      evidenceIds: { ...strArr, description: 'Evidence IDs from the snapshot that support this claim. Empty only for pure assumptions.' },
      nature: { type: 'string', enum: ['fact', 'inference', 'assumption'] },
      rebuttedClaimId: { ...nullableStr, description: 'Opponent claim id this claim answers, or null.' },
    }),
  },
  chartCue: {
    anyOf: [obj({ evidenceId: str, chartType: { type: 'string', enum: [...CHART_TYPES] } }), { type: 'null' }],
  },
  modelInputRefs: { type: 'array', items: { type: 'string', enum: [...MODEL_INPUT_KEYS] } },
});

const scoreJson = obj({
  evidenceAccuracy: { type: 'number', description: '0 to 40' },
  methodology: { type: 'number', description: '0 to 20' },
  rebuttals: { type: 'number', description: '0 to 20' },
  risks: { type: 'number', description: '0 to 10' },
  transparency: { type: 'number', description: '0 to 10' },
});

export const JudgeJsonSchema = obj({
  speech: { type: 'string', description: 'The spoken verdict, 110 to 180 words.' },
  scores: obj({ bull: scoreJson, bear: scoreJson }),
  scoreNotes: obj({ bull: str, bear: str }),
  winner: { type: 'string', enum: ['bull', 'bear', 'inconclusive'] },
  decisiveEvidenceIds: { ...strArr, description: 'At most 6 evidence IDs.' },
  unsupportedClaims: { type: 'array', description: 'At most 12.', items: obj({ claimId: str, reason: { type: 'string', description: 'At most 300 characters.' } }) },
  inputChallenges: { type: 'array', description: 'At most 6.', items: obj({ input: { type: 'string', enum: [...MODEL_INPUT_KEYS] }, challenge: { type: 'string', description: 'At most 400 characters.' } }) },
  verdictRationale: { type: 'string', description: 'At most 1500 characters.' },
  whatWouldChangeMyMind: { ...strArr, description: '2 to 4 items, each at most 300 characters.' },
  confidenceLabel: { type: 'string', enum: ['low', 'moderate', 'high'] },
});
