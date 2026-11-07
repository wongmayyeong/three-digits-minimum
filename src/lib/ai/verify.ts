/**
 * Deterministic audit of model output against the frozen snapshot. The LLM is never the
 * authority on whether a citation or number is real: this module is.
 *
 *  - Every evidence ID must exist in the snapshot. Unknown IDs are removed and the claim is
 *    marked unsupported.
 *  - A "fact" claim citing only unavailable evidence is unsupported.
 *  - Numbers spoken in the turn are matched against snapshot values (with unit scaling and
 *    rounding tolerance). Unmatched numbers are flagged as unverified, never silently kept.
 */
import { wordCount } from '@/lib/format';
import type { TurnOutput } from './schemas';

export interface SnapshotIndexItem {
  evidenceId: string;
  value: number | null;
  unit: string;
  available: boolean;
  valueText: string | null;
}

export type ClaimStatus = 'supported' | 'unsupported' | 'assumption';

export interface VerifiedClaim {
  id: string;
  text: string;
  evidenceIds: string[];
  metricKeys: string[];
  nature: 'fact' | 'inference' | 'assumption';
  rebuttedClaimId: string | null;
  status: ClaimStatus;
  problems: string[];
}

export interface NumberCheck {
  token: string;
  value: number;
  matched: boolean;
  matchedEvidenceId: string | null;
}

export interface TurnAudit {
  wordCount: number;
  withinLength: boolean;
  invalidEvidenceIds: string[];
  unavailableCitations: string[];
  numbers: NumberCheck[];
  unverifiedNumbers: string[];
  invalidRebuttalRefs: string[];
  problems: string[];
  /** Problems severe enough to request a repair from the model. */
  blocking: string[];
}

export interface VerifiedTurn {
  beats: { text: string; claimId: string | null }[];
  speechText: string;
  claims: VerifiedClaim[];
  chartCue: { evidenceId: string; chartType: string } | null;
  modelInputRefs: string[];
  audit: TurnAudit;
}

// Numbers like $11.7 billion, 0.15%, 4.96x, 61,647, 2.2M, 80 percent.
const NUM_RE = /(\$\s?)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(trillion|billion|million|thousand|percent|per cent|tn|bn|[TBMKk]\b|%|x\b|times\b|-fold\b|fold\b)?/gi;
const SCALE: Record<string, number> = { trillion: 1e12, tn: 1e12, t: 1e12, billion: 1e9, bn: 1e9, b: 1e9, million: 1e6, m: 1e6, thousand: 1e3, k: 1e3 };

export interface SpokenNumber {
  token: string;
  value: number;
  kind: 'money' | 'percent' | 'multiple' | 'plain';
}

export function extractNumbers(text: string): SpokenNumber[] {
  const out: SpokenNumber[] = [];
  for (const m of text.matchAll(NUM_RE)) {
    const [token, dollar, digits, suffixRaw] = m;
    if (!digits) continue;
    let value = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const suffix = (suffixRaw ?? '').toLowerCase();
    let kind: SpokenNumber['kind'] = dollar ? 'money' : 'plain';
    if (suffix === '%' || suffix === 'percent' || suffix === 'per cent') kind = 'percent';
    else if (['x', 'times', '-fold', 'fold'].includes(suffix)) kind = 'multiple';
    else if (SCALE[suffix] !== undefined) value *= SCALE[suffix]!;
    // Skip years, small counts and phrasing such as "90 days", "3 to 5 years", "2 sides".
    const after = text.slice((m.index ?? 0) + token.length, (m.index ?? 0) + token.length + 12).toLowerCase();
    if (kind === 'plain' && !dollar && SCALE[suffix] === undefined) {
      if (value >= 1900 && value <= 2100 && Number.isInteger(value)) continue;
      if (value <= 12 && Number.isInteger(value)) continue;
      if (/^\s*(-|\s)?(day|days|week|weeks|month|months|year|years|quarter|quarters)\b/.test(after)) continue;
    }
    if (kind === 'multiple' && value <= 1) continue;
    out.push({ token: token.trim(), value, kind });
  }
  return out;
}

/** Candidate spoken values for an evidence item, in the units a speaker would use. */
function candidates(it: SnapshotIndexItem): { v: number; kinds: SpokenNumber['kind'][] }[] {
  if (it.value === null || !it.available) return [];
  const v = it.value;
  switch (it.unit) {
    case 'fraction': return [{ v: v * 100, kinds: ['percent', 'plain'] }, { v: Math.abs(v * 100), kinds: ['percent', 'plain'] }, { v: v * 1e4, kinds: ['plain'] }, { v: 1 + v, kinds: ['multiple'] }];
    case 'ratio': return [{ v, kinds: ['multiple', 'plain'] }];
    case 'USD': return [{ v, kinds: ['money', 'plain'] }];
    default: return [{ v, kinds: ['plain', 'money'] }];
  }
}

const TOLERANCE = 0.035;
const close = (a: number, b: number) => (b === 0 ? Math.abs(a) < 1e-9 : Math.abs(a - b) / Math.abs(b) <= TOLERANCE);

export function matchNumber(n: SpokenNumber, items: SnapshotIndexItem[], extraAllowed: number[] = []): string | null {
  for (const it of items) {
    for (const c of candidates(it)) {
      if (c.kinds.includes(n.kind) && close(n.value, c.v)) return it.evidenceId;
    }
  }
  // Numbers quoted in third-party definitions (e.g. "70% of every gas fee") and fixed scenario parameters.
  if (extraAllowed.some((a) => close(n.value, a))) return 'ALLOWED';
  return null;
}

/** Numbers that appear in evidence text, plus scenario parameters. They may be quoted. */
export function allowedConstants(items: SnapshotIndexItem[]): number[] {
  const set = new Set<number>([0.5, 1, 2, 5, 25, 50, 75, 100, 90, 30, 365]);
  for (const it of items) for (const n of extractNumbers(it.valueText ?? '')) set.add(n.value);
  return [...set];
}

export function verifyTurn(
  out: TurnOutput,
  ctx: { snapshot: SnapshotIndexItem[]; metricKeyOf: (id: string) => string | null; claimPrefix: string; opponentClaimIds: string[]; minWords: number; maxWords: number; requiresRebuttal: boolean },
): VerifiedTurn {
  const byId = new Map(ctx.snapshot.map((s) => [s.evidenceId, s]));
  const idMap = new Map<string, string>();
  out.claims.forEach((c, i) => idMap.set(c.id, `${ctx.claimPrefix}-${i + 1}`));

  const invalid = new Set<string>();
  const unavailable = new Set<string>();
  const invalidRebuttal: string[] = [];

  const claims: VerifiedClaim[] = out.claims.map((c, i) => {
    const problems: string[] = [];
    const valid = c.evidenceIds.filter((id) => {
      if (byId.has(id)) return true;
      invalid.add(id);
      problems.push(`cites unknown evidence ID ${id}`);
      return false;
    });
    const usable = valid.filter((id) => {
      if (byId.get(id)!.available) return true;
      unavailable.add(id);
      return false;
    });
    let rebutted = c.rebuttedClaimId;
    if (rebutted && !ctx.opponentClaimIds.includes(rebutted)) {
      invalidRebuttal.push(rebutted);
      problems.push(`rebuts unknown claim ${rebutted}`);
      rebutted = null;
    }
    let status: ClaimStatus = 'supported';
    if (c.nature === 'assumption') status = 'assumption';
    else if (usable.length === 0) {
      status = 'unsupported';
      problems.push(valid.length ? 'cites only unavailable evidence' : 'no valid evidence cited');
    }
    return {
      id: `${ctx.claimPrefix}-${i + 1}`,
      text: c.text,
      evidenceIds: [...new Set(valid)],
      metricKeys: [...new Set(valid.map((id) => ctx.metricKeyOf(id)).filter((k): k is string => !!k))],
      nature: c.nature,
      rebuttedClaimId: rebutted,
      status,
      problems,
    };
  });

  const beats = out.beats.map((b) => ({ text: b.text.trim(), claimId: b.claimId && idMap.has(b.claimId) ? idMap.get(b.claimId)! : null })).filter((b) => b.text);
  const speechText = beats.map((b) => b.text).join(' ');
  const words = wordCount(speechText);

  // Numbers are checked against everything in the snapshot, not only cited items, because a
  // speaker may restate a figure from an earlier claim; the citation check is separate.
  const extra = allowedConstants(ctx.snapshot);
  const numbers: NumberCheck[] = extractNumbers(speechText).map((n) => {
    const hit = matchNumber(n, ctx.snapshot, extra);
    return { token: n.token, value: n.value, matched: hit !== null, matchedEvidenceId: hit };
  });
  const unverified = numbers.filter((n) => !n.matched).map((n) => n.token);

  let chartCue = out.chartCue;
  if (chartCue && !byId.get(chartCue.evidenceId)?.available) chartCue = null;

  const problems: string[] = [];
  const blocking: string[] = [];
  if (invalid.size) blocking.push(`Unknown evidence IDs: ${[...invalid].join(', ')}. Use only IDs from EVIDENCE DATA.`);
  if (words > ctx.maxWords + 25) blocking.push(`Too long: ${words} words; the limit is ${ctx.maxWords}.`);
  if (words < ctx.minWords - 30) blocking.push(`Too short: ${words} words; the minimum is ${ctx.minWords}.`);
  if (unverified.length > 2) blocking.push(`These numbers do not match any snapshot value: ${unverified.join(', ')}. Quote figures from the evidence display values.`);
  if (ctx.requiresRebuttal && ctx.opponentClaimIds.length && !claims.some((c) => c.rebuttedClaimId)) blocking.push('No claim rebuts an opponent claim; set rebuttedClaimId on at least one claim.');
  if (unavailable.size) problems.push(`Cites unavailable evidence: ${[...unavailable].join(', ')}`);
  if (unverified.length) problems.push(`Unverified numbers: ${unverified.join(', ')}`);
  if (invalidRebuttal.length) problems.push(`Unknown rebuttal references: ${invalidRebuttal.join(', ')}`);
  for (const c of claims) if (c.status === 'unsupported') problems.push(`${c.id} unsupported: ${c.problems.join('; ')}`);

  return {
    beats,
    speechText,
    claims,
    chartCue,
    modelInputRefs: [...new Set(out.modelInputRefs)],
    audit: {
      wordCount: words,
      withinLength: words >= ctx.minWords - 10 && words <= ctx.maxWords + 10,
      invalidEvidenceIds: [...invalid],
      unavailableCitations: [...unavailable],
      numbers,
      unverifiedNumbers: unverified,
      invalidRebuttalRefs: invalidRebuttal,
      problems: [...blocking, ...problems],
      blocking,
    },
  };
}

// ---------------------------------------------------------------- judge scoring

export interface SideScore {
  evidenceAccuracy: number;
  methodology: number;
  rebuttals: number;
  risks: number;
  transparency: number;
  total: number;
}

export interface PenaltyRecord {
  side: 'bull' | 'bear';
  unsupportedClaims: number;
  unverifiedNumbers: number;
  invalidCitations: number;
  points: number;
}

const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));

/**
 * Applies deterministic citation penalties to the Judge's subjective scores and decides the
 * final winner. The LLM's pick stands unless penalized totals contradict it.
 */
export function finalizeScores(
  raw: { bull: Omit<SideScore, 'total'>; bear: Omit<SideScore, 'total'> },
  llmWinner: 'bull' | 'bear' | 'inconclusive',
  audits: { side: 'bull' | 'bear'; audit: TurnAudit; claims: VerifiedClaim[] }[],
): { scores: { bull: SideScore; bear: SideScore }; penalties: PenaltyRecord[]; winner: 'bull' | 'bear' | 'inconclusive'; overrideReason: string | null } {
  const penalties: PenaltyRecord[] = (['bull', 'bear'] as const).map((side) => {
    const mine = audits.filter((a) => a.side === side);
    const unsupported = mine.reduce((n, a) => n + a.claims.filter((c) => c.status === 'unsupported').length, 0);
    const unverified = mine.reduce((n, a) => n + a.audit.unverifiedNumbers.length, 0);
    const invalid = mine.reduce((n, a) => n + a.audit.invalidEvidenceIds.length, 0);
    return { side, unsupportedClaims: unsupported, unverifiedNumbers: unverified, invalidCitations: invalid, points: Math.min(30, unsupported * 4 + unverified * 2 + invalid * 3) };
  });
  const side = (s: 'bull' | 'bear'): SideScore => {
    const r = raw[s];
    const p = penalties.find((x) => x.side === s)!.points;
    const evidenceAccuracy = clamp(r.evidenceAccuracy - p, 40);
    const methodology = clamp(r.methodology, 20);
    const rebuttals = clamp(r.rebuttals, 20);
    const risks = clamp(r.risks, 10);
    const transparency = clamp(r.transparency, 10);
    return { evidenceAccuracy, methodology, rebuttals, risks, transparency, total: evidenceAccuracy + methodology + rebuttals + risks + transparency };
  };
  const scores = { bull: side('bull'), bear: side('bear') };
  const margin = scores.bull.total - scores.bear.total;
  let winner = llmWinner;
  let overrideReason: string | null = null;
  if (llmWinner === 'bull' && margin < 0) {
    winner = margin <= -5 ? 'bear' : 'inconclusive';
    overrideReason = `After citation penalties Bear scores ${scores.bear.total} vs Bull ${scores.bull.total}, which contradicts the Judge's pick.`;
  } else if (llmWinner === 'bear' && margin > 0) {
    winner = margin >= 5 ? 'bull' : 'inconclusive';
    overrideReason = `After citation penalties Bull scores ${scores.bull.total} vs Bear ${scores.bear.total}, which contradicts the Judge's pick.`;
  }
  return { scores, penalties, winner, overrideReason };
}
