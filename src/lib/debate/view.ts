/**
 * Read models for pages and API routes. They expose public IDs and stored content only;
 * no credentials, client hashes or internal job state leave the server.
 */
import { db } from '@/lib/storage/db';
import { getTopic, TOPICS } from '@/lib/topics/topics';
import type { SourceStatusEntry } from '@/lib/research/types';
import type { SensitivityMatrix, ModelInputs } from '@/lib/research/model';

export interface EvidenceView {
  evidenceId: string;
  metricKey: string;
  label: string;
  value: number | null;
  valueText: string | null;
  unit: string;
  observationType: 'OBSERVED' | 'DERIVED' | 'REPORTED' | 'ASSUMED';
  available: boolean;
  sourceName: string;
  sourceUrl: string;
  observedAt: string | null;
  fetchedAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  methodology: string;
  transform: string;
  confidence: string;
  rawResponseHash: string | null;
  validationNotes: string | null;
  series: { label: string; unit: string; aggregation: string; points: [string, number][] } | null;
}

export interface SnapshotView {
  id: string;
  topicSlug: string;
  mode: string;
  createdAt: string;
  cutoffAt: string;
  windowEnd: string | null;
  peerWindowEnd: string | null;
  methodologyVersion: string;
  formulaVersion: string | null;
  contentHash: string;
  sources: SourceStatusEntry[];
  items: EvidenceView[];
  scenarios: { key: string; label: string; inputs: Record<string, unknown>; outputs: Record<string, unknown> }[];
  modelBase: ModelInputs | null;
  feeSensitivity: SensitivityMatrix | null;
  allocationMatrix: SensitivityMatrix | null;
}

export interface AudioView {
  url: string;
  mimeType: string;
  durationSec: number;
  provider: string;
  model: string;
  voiceId: string;
  alignmentKind: string;
  alignment: { chars: string[]; starts: number[]; ends: number[] } | null;
}

export interface ClaimView {
  id: string;
  text: string;
  evidenceIds: string[];
  metricKeys: string[];
  nature: string;
  rebuttedClaimId: string | null;
  status: string;
  problems: string[];
}

export interface TurnView {
  id: string;
  seq: number;
  phase: string;
  actor: 'bull' | 'bear' | 'judge';
  speechText: string;
  beats: { text: string; claimId: string | null }[];
  claims: ClaimView[];
  chartCue: { evidenceId: string; chartType: string } | null;
  modelInputRefs: string[];
  audit: { wordCount: number; problems: string[]; unverifiedNumbers: string[]; invalidEvidenceIds: string[]; numbers: { token: string; matched: boolean; matchedEvidenceId: string | null }[] };
  textHash: string;
  model: string;
  promptVersion: string;
  audioStatus: string;
  audioError: string | null;
  audio: AudioView | null;
  createdAt: string;
}

export interface VerdictView {
  winner: 'bull' | 'bear' | 'inconclusive';
  llmWinner: string;
  overrideReason: string | null;
  scores: Record<'bull' | 'bear', { evidenceAccuracy: number; methodology: number; rebuttals: number; risks: number; transparency: number; total: number }>;
  rawScores: Record<'bull' | 'bear', Record<string, number>>;
  penalties: { side: string; unsupportedClaims: number; unverifiedNumbers: number; invalidCitations: number; points: number }[];
  decisiveEvidenceIds: string[];
  unsupportedClaims: { claimId: string; reason: string; source: string }[];
  verdictRationale: string;
  inputChallenges: { input: string; challenge: string }[];
  whatWouldChangeMyMind: string[];
  confidenceLabel: string;
  model: string;
  scoreNotes: { bull: string; bear: string } | null;
}

export interface DebateView {
  id: string;
  topicSlug: string;
  status: string;
  failureReason: string | null;
  failedAtStatus: string | null;
  synthetic: boolean;
  aiProvider: string;
  aiModel: string;
  promptVersion: string;
  voiceProvider: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  parentId: string | null;
  rematchIds: string[];
  snapshot: SnapshotView | null;
  turns: TurnView[];
  verdict: VerdictView | null;
  replay: { seq: number; kind: string; payload: Record<string, unknown> }[];
  lastEventId: string | null;
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export async function loadSnapshotView(snapshotId: string): Promise<SnapshotView | null> {
  const s = await db().evidenceSnapshot.findUnique({ where: { id: snapshotId }, include: { items: { orderBy: { order: 'asc' } }, scenarios: true } });
  if (!s) return null;
  const meta = s.sourceStatus as { entries?: SourceStatusEntry[]; peerWindowEnd?: string | null; formulaVersion?: string; feeSensitivity?: SensitivityMatrix | null; allocationMatrix?: SensitivityMatrix | null; modelBase?: ModelInputs | null };
  const order = ['conservative', 'base', 'optimistic'];
  return {
    id: s.publicId,
    topicSlug: s.topicSlug,
    mode: s.mode,
    createdAt: s.createdAt.toISOString(),
    cutoffAt: s.cutoffAt.toISOString(),
    windowEnd: iso(s.windowEnd),
    peerWindowEnd: meta.peerWindowEnd ?? null,
    methodologyVersion: s.methodologyVersion,
    formulaVersion: meta.formulaVersion ?? null,
    contentHash: s.contentHash,
    sources: meta.entries ?? [],
    items: s.items.map((i) => ({
      evidenceId: i.evidenceId, metricKey: i.metricKey, label: i.label, value: i.value, valueText: i.valueText, unit: i.unit,
      observationType: i.observationType, available: i.available, sourceName: i.sourceName, sourceUrl: i.sourceUrl,
      observedAt: iso(i.observedAt), fetchedAt: iso(i.fetchedAt), periodStart: iso(i.periodStart), periodEnd: iso(i.periodEnd),
      methodology: i.methodology, transform: i.transform, confidence: i.confidence, rawResponseHash: i.rawResponseHash,
      validationNotes: i.validationNotes, series: (i.series as EvidenceView['series']) ?? null,
    })),
    scenarios: [...s.scenarios].sort((a, b) => order.indexOf(a.scenarioKey) - order.indexOf(b.scenarioKey))
      .map((x) => ({ key: x.scenarioKey, label: x.label, inputs: x.inputs as Record<string, unknown>, outputs: x.outputs as Record<string, unknown> })),
    modelBase: meta.modelBase ?? null,
    feeSensitivity: meta.feeSensitivity ?? null,
    allocationMatrix: meta.allocationMatrix ?? null,
  };
}

export async function loadDebateView(publicId: string): Promise<DebateView | null> {
  const s = await db().debateSession.findUnique({
    where: { publicId },
    include: {
      turns: { orderBy: { seq: 'asc' }, include: { audioAsset: { select: { id: true, mimeType: true, durationSec: true, provider: true, model: true, voiceId: true, alignmentKind: true, alignment: true } } } },
      verdict: true,
      replayEvents: { orderBy: { seq: 'asc' } },
      parent: { select: { publicId: true } },
      rematches: { select: { publicId: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!s) return null;
  const last = await db().jobEvent.findFirst({ where: { sessionId: s.id }, orderBy: { id: 'desc' }, select: { id: true } });
  const judgeTurn = s.turns.find((t) => t.actor === 'judge');
  return {
    id: s.publicId,
    topicSlug: s.topicSlug,
    status: s.status,
    failureReason: s.failureReason,
    failedAtStatus: s.failedAtStatus,
    synthetic: s.synthetic,
    aiProvider: s.aiProvider,
    aiModel: s.aiModel,
    promptVersion: s.promptVersion,
    voiceProvider: s.voiceProvider,
    createdAt: s.createdAt.toISOString(),
    startedAt: iso(s.startedAt),
    completedAt: iso(s.completedAt),
    parentId: s.parent?.publicId ?? null,
    rematchIds: s.rematches.map((r) => r.publicId),
    snapshot: s.snapshotId ? await loadSnapshotView(s.snapshotId) : null,
    turns: s.turns.map((t) => ({
      id: t.id, seq: t.seq, phase: t.phase, actor: t.actor as TurnView['actor'], speechText: t.speechText,
      beats: t.beats as TurnView['beats'], claims: t.claims as unknown as ClaimView[], chartCue: (t.chartCue as TurnView['chartCue']) ?? null,
      modelInputRefs: t.modelInputRefs as string[], audit: t.audit as unknown as TurnView['audit'], textHash: t.textHash, model: t.model,
      promptVersion: t.promptVersion, audioStatus: t.audioStatus, audioError: t.audioError, createdAt: t.createdAt.toISOString(),
      audio: t.audioStatus === 'READY' && t.audioAsset ? {
        url: `/api/audio/${t.audioAsset.id}`, mimeType: t.audioAsset.mimeType, durationSec: t.audioAsset.durationSec, provider: t.audioAsset.provider,
        model: t.audioAsset.model, voiceId: t.audioAsset.voiceId, alignmentKind: t.audioAsset.alignmentKind, alignment: t.audioAsset.alignment as AudioView['alignment'],
      } : null,
    })),
    verdict: s.verdict ? {
      winner: s.verdict.winner as VerdictView['winner'], llmWinner: s.verdict.llmWinner, overrideReason: s.verdict.overrideReason,
      scores: s.verdict.scores as VerdictView['scores'], rawScores: s.verdict.rawScores as VerdictView['rawScores'], penalties: s.verdict.penalties as VerdictView['penalties'],
      decisiveEvidenceIds: s.verdict.decisiveEvidenceIds as string[], unsupportedClaims: s.verdict.unsupportedClaims as VerdictView['unsupportedClaims'],
      verdictRationale: s.verdict.verdictRationale, inputChallenges: s.verdict.inputChallenges as VerdictView['inputChallenges'],
      whatWouldChangeMyMind: s.verdict.whatWouldChangeMyMind as string[], confidenceLabel: s.verdict.confidenceLabel, model: s.verdict.model,
      scoreNotes: ((judgeTurn?.audit as { scoreNotes?: { bull: string; bear: string } } | undefined)?.scoreNotes) ?? null,
    } : null,
    replay: s.replayEvents.map((e) => ({ seq: e.seq, kind: e.kind, payload: e.payload as Record<string, unknown> })),
    lastEventId: last ? last.id.toString() : null,
  };
}

export interface LibraryEntry {
  id: string;
  topicSlug: string;
  topicLabel: string;
  status: string;
  winner: string | null;
  scores: { bull: number; bear: number } | null;
  createdAt: string;
  completedAt: string | null;
  snapshotId: string | null;
  windowEnd: string | null;
  isRematch: boolean;
  model: string;
}

export async function listLibrary(opts: { topic?: string; winner?: string; from?: Date; to?: Date; cursor?: string; limit?: number }) {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const where = {
    isPublic: true,
    synthetic: process.env.NEBUBE_SHOW_SYNTHETIC === '1' && process.env.NODE_ENV !== 'production' ? undefined : false,
    status: 'COMPLETE' as const,
    topicSlug: { in: TOPICS.map((t) => t.slug) as string[] },
    ...(opts.winner && ['bull', 'bear', 'inconclusive'].includes(opts.winner) ? { verdict: { winner: opts.winner } } : {}),
    ...(opts.from || opts.to ? { completedAt: { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) } } : {}),
  };
  const rows = await db().debateSession.findMany({
    where,
    orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(opts.cursor ? { cursor: { publicId: opts.cursor }, skip: 1 } : {}),
    include: { verdict: { select: { winner: true, scores: true } }, snapshot: { select: { publicId: true, windowEnd: true } } },
  });
  const page = rows.slice(0, limit);
  const entries: LibraryEntry[] = page.map((r) => {
    const sc = r.verdict?.scores as VerdictView['scores'] | undefined;
    return {
      id: r.publicId, topicSlug: r.topicSlug, topicLabel: getTopic(r.topicSlug)?.shortLabel ?? r.topicSlug, status: r.status,
      winner: r.verdict?.winner ?? null, scores: sc ? { bull: sc.bull.total, bear: sc.bear.total } : null,
      createdAt: r.createdAt.toISOString(), completedAt: iso(r.completedAt), snapshotId: r.snapshot?.publicId ?? null,
      windowEnd: iso(r.snapshot?.windowEnd), isRematch: !!r.parentId, model: r.aiModel,
    };
  });
  return { entries, nextCursor: rows.length > limit ? page[page.length - 1]!.publicId : null };
}

export const TOPIC_ORDER = TOPICS.map((t) => t.slug);
