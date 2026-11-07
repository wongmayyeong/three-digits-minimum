/**
 * Durable debate orchestration. `advance()` performs exactly one state transition and
 * persists it before returning, so a crash at any point resumes from the last committed
 * step. Every step is idempotent: a turn already stored for a phase is never regenerated.
 */
import { sha256 } from '@/lib/data/sources';
import { FixtureProvider, type FixtureContext } from '@/lib/ai/fixture';
import { buildJudgePrompt, buildTurnPrompt, evidenceForPrompt, PROMPT_VERSION, type PriorTurn, type PromptEvidence, type PromptModel } from '@/lib/ai/prompts';
import { LlmError, resolveLlm, type LlmProvider } from '@/lib/ai/provider';
import { JudgeJsonSchema, JudgeOutputSchema, TurnJsonSchema, TurnOutputSchema } from '@/lib/ai/schemas';
import { finalizeScores, verifyTurn, type SnapshotIndexItem, type TurnAudit, type VerifiedClaim } from '@/lib/ai/verify';
import { db } from '@/lib/storage/db';
import { getTopic } from '@/lib/topics/topics';
import { emit } from './events';
import { enqueue } from './jobs';
import { nextStatus, PHASES, phaseDef, type DebatePhase, type DebateStatus } from './phases';
import { createSnapshot, loadSnapshot, type LoadedSnapshot } from './snapshot';
import { buildReplayTimeline } from './replay';
import { budgetCheck, recordUsage } from './budget';
import { DebateStepError } from './errors';

export { DebateStepError };

export function getProvider(): LlmProvider {
  const { provider, status } = resolveLlm();
  if (provider) return provider;
  if (status.provider === 'fixture') return new FixtureProvider();
  throw new DebateStepError(status.reason ?? 'No LLM configured', false);
}

/** Minimum share of a topic's evidence that must be available to hold a debate. */
const MIN_AVAILABLE_SHARE = 0.6;

export async function advance(sessionId: string): Promise<{ done: boolean; status: DebateStatus }> {
  const session = await db().debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  const status = session.status as DebateStatus;
  if (status === 'COMPLETE' || status === 'FAILED' || status === 'PARTIAL') return { done: true, status };
  const topic = getTopic(session.topicSlug);
  if (!topic) throw new DebateStepError('Unknown topic', false);

  const move = async (to: DebateStatus, extra: Record<string, unknown> = {}) => {
    await db().debateSession.update({ where: { id: sessionId }, data: { status: to, ...extra } });
    await emit(sessionId, 'status', { status: to });
    return { done: to === 'COMPLETE', status: to };
  };

  switch (status) {
    case 'PENDING':
      return move('FETCHING', { startedAt: new Date() });

    case 'FETCHING': {
      if (session.snapshotId) return move('VALIDATING');
      const parent = session.parentId ? await db().debateSession.findUnique({ where: { id: session.parentId } }) : null;
      const { snapshot, outcomes } = await createSnapshot(session.topicSlug, {
        forceFresh: !!parent,
        onFetch: (o) => emit(sessionId, 'fetch', { key: o.key, source: o.source, status: o.status, cacheHit: o.cacheHit, stale: o.stale, durationMs: o.durationMs, error: o.error }),
      });
      const ok = outcomes.filter((o) => o.status === 'OK').length;
      await db().debateSession.update({ where: { id: sessionId }, data: { snapshotId: snapshot.id } });
      await emit(sessionId, 'snapshot', { snapshotId: snapshot.publicId, sourcesOk: ok, sourcesTotal: outcomes.length });
      return move('VALIDATING');
    }

    case 'VALIDATING': {
      const snap = await loadSnapshot(session.snapshotId!);
      if (!snap) throw new DebateStepError('Snapshot missing', false);
      const avail = snap.items.filter((i) => i.available).length;
      const share = avail / Math.max(1, snap.items.length);
      await emit(sessionId, 'validation', { available: avail, total: snap.items.length });
      if (share < MIN_AVAILABLE_SHARE) {
        throw new DebateStepError(`Only ${avail} of ${snap.items.length} evidence items are available right now, below the ${Math.round(MIN_AVAILABLE_SHARE * 100)}% needed for a fair debate. Source status is shown on the debate page; try again later.`, false);
      }
      return move('MODELING');
    }

    case 'MODELING': {
      const snap = await loadSnapshot(session.snapshotId!);
      await emit(sessionId, 'model', { scenarios: snap?.scenarios.map((s) => ({ key: s.scenarioKey, outputs: s.outputs })) ?? [] });
      return move('BULL_OPEN');
    }

    case 'JUDGING': {
      const existing = await db().judgeVerdict.findUnique({ where: { sessionId } });
      if (!existing) await runJudge(sessionId);
      await buildReplayTimeline(sessionId);
      return move('COMPLETE', { completedAt: new Date() });
    }

    default: {
      const def = phaseDef(status);
      if (!def) throw new DebateStepError(`Unexpected status ${status}`, false);
      const existing = await db().debateTurn.findUnique({ where: { sessionId_phase: { sessionId, phase: def.phase } } });
      if (!existing) await runTurn(sessionId, def.phase);
      return move(nextStatus(status)!);
    }
  }
}

// ---------------------------------------------------------------- helpers

function snapshotIndex(snap: LoadedSnapshot): SnapshotIndexItem[] {
  return snap.items.map((i) => ({ evidenceId: i.evidenceId, value: i.value, unit: i.unit, available: i.available, valueText: i.valueText }));
}

function promptEvidence(snap: LoadedSnapshot): PromptEvidence[] {
  return evidenceForPrompt(snap.items.map((i) => ({
    evidenceId: i.evidenceId, label: i.label, value: i.value, valueText: i.valueText, unit: i.unit, observationType: i.observationType,
    available: i.available, methodology: i.methodology, periodStart: i.periodStart?.toISOString().slice(0, 10) ?? null,
    periodEnd: i.periodEnd?.toISOString().slice(0, 10) ?? null, validationNotes: i.validationNotes,
  })));
}

function promptModel(snap: LoadedSnapshot): PromptModel | null {
  const base = (snap.sourceStatus as { modelBase?: PromptModel['inputs'] | null }).modelBase;
  if (!base || !snap.scenarios.length) return null;
  const order = ['conservative', 'base', 'optimistic'];
  return {
    formulaVersion: snap.scenarios[0]!.formulaVersion,
    inputs: base,
    scenarios: [...snap.scenarios].sort((a, b) => order.indexOf(a.scenarioKey) - order.indexOf(b.scenarioKey)).map((s) => {
      const o = s.outputs as { buybackDemandToMcap: number | null; volumeMultipleRequired: number | null; annualBuybackDemandUsd: number | null };
      return { key: s.scenarioKey, label: s.label, rationale: String((s.inputs as { rationale?: string }).rationale ?? ''), buybackToMcap: o.buybackDemandToMcap, volumeMultiple: o.volumeMultipleRequired, annualBuybackUsd: o.annualBuybackDemandUsd };
    }),
  };
}

async function priorTurns(sessionId: string): Promise<PriorTurn[]> {
  const turns = await db().debateTurn.findMany({ where: { sessionId, actor: { in: ['bull', 'bear'] } }, orderBy: { seq: 'asc' } });
  return turns.map((t) => ({
    phase: t.phase as DebatePhase,
    actor: t.actor as 'bull' | 'bear',
    speech: t.speechText,
    claims: (t.claims as unknown as VerifiedClaim[]).map((c) => ({ id: c.id, text: c.text, evidenceIds: c.evidenceIds, nature: c.nature, status: c.status })),
  }));
}

async function callWithRetry<T>(sessionId: string, provider: LlmProvider, kind: string, fn: () => Promise<T & { usage: { inputTokens: number; outputTokens: number; model: string } }>): Promise<T> {
  let last: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await budgetCheck();
    try {
      const r = await fn();
      await recordUsage({ sessionId, provider, kind, model: r.usage.model, inputTokens: r.usage.inputTokens, outputTokens: r.usage.outputTokens, success: true });
      return r;
    } catch (e) {
      last = e as Error;
      await recordUsage({ sessionId, provider, kind, model: provider.model, inputTokens: 0, outputTokens: 0, success: false });
      const retryable = e instanceof LlmError ? e.retryable : !(e instanceof DebateStepError);
      if (!retryable) break;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }
  }
  throw new DebateStepError(`AI generation failed: ${last?.message ?? 'unknown error'}`, true);
}

async function runTurn(sessionId: string, phase: DebatePhase) {
  const session = await db().debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  const topic = getTopic(session.topicSlug)!;
  const def = phaseDef(phase)!;
  const snap = (await loadSnapshot(session.snapshotId!))!;
  const index = snapshotIndex(snap);
  const evidence = promptEvidence(snap);
  const model = promptModel(snap);
  const prior = await priorTurns(sessionId);
  const opponentClaimIds = prior.filter((t) => t.actor !== def.actor).flatMap((t) => t.claims.map((c) => c.id));
  const metricKeyOf = (id: string) => snap.items.find((i) => i.evidenceId === id)?.metricKey ?? null;
  const provider = getProvider();
  const seq = PHASES.findIndex((p) => p.phase === phase) + 1;

  await emit(sessionId, 'turn_started', { phase, actor: def.actor });
  const started = Date.now();
  let repairNotes: string[] = [];
  let attempts = 0;
  let result: ReturnType<typeof verifyTurn> | null = null;
  let usedModel = provider.model;

  // Up to two drafts: the second is a repair pass with the server audit's objections.
  for (let draft = 0; draft < 2; draft++) {
    attempts++;
    const { system, user } = buildTurnPrompt({ topic, phase: def, evidence, model, prior, repairNotes });
    const context: FixtureContext = { kind: 'turn', actor: def.actor, phase, evidence, opponentClaimIds, allClaimIds: opponentClaimIds };
    const out = await callWithRetry(sessionId, provider, `turn:${phase}`, async () => {
      const r = await provider.generate({ system, user, schemaName: 'debate_turn', jsonSchema: TurnJsonSchema, maxOutputTokens: Number(process.env.LLM_MAX_OUTPUT_TOKENS ?? 2500), context });
      const parsed = TurnOutputSchema.safeParse(r.json);
      if (!parsed.success) throw new LlmError(`Turn failed schema validation: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`, true);
      return { parsed: parsed.data, usage: { inputTokens: r.inputTokens, outputTokens: r.outputTokens, model: r.model } };
    });
    usedModel = out.usage.model;
    result = verifyTurn(out.parsed, { snapshot: index, metricKeyOf, claimPrefix: def.code, opponentClaimIds, minWords: def.minWords, maxWords: def.maxWords, requiresRebuttal: def.requiresRebuttal });
    if (!result.audit.blocking.length) break;
    repairNotes = result.audit.blocking;
    await emit(sessionId, 'turn_repair', { phase, problems: result.audit.blocking });
  }
  const v = result!;
  const turn = await db().debateTurn.create({
    data: {
      sessionId, seq, phase, actor: def.actor, speechText: v.speechText, beats: v.beats as object, claims: v.claims as unknown as object,
      chartCue: (v.chartCue ?? undefined) as object | undefined, modelInputRefs: v.modelInputRefs, audit: v.audit as unknown as object,
      textHash: sha256(v.speechText), model: usedModel, promptVersion: PROMPT_VERSION, latencyMs: Date.now() - started, attempts, audioStatus: 'PENDING',
    },
  });
  await enqueue('audio', turn.id);
  await emit(sessionId, 'turn', { phase, actor: def.actor, turnId: turn.id });
}

async function runJudge(sessionId: string) {
  const session = await db().debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  const topic = getTopic(session.topicSlug)!;
  const snap = (await loadSnapshot(session.snapshotId!))!;
  const evidence = promptEvidence(snap);
  const model = promptModel(snap);
  const turns = await db().debateTurn.findMany({ where: { sessionId, actor: { in: ['bull', 'bear'] } }, orderBy: { seq: 'asc' } });
  const prior = await priorTurns(sessionId);
  const audits = turns.map((t) => ({ side: t.actor as 'bull' | 'bear', audit: t.audit as unknown as TurnAudit, claims: t.claims as unknown as VerifiedClaim[], phase: t.phase }));
  const auditLines = audits.flatMap((a) => a.audit.problems.map((p) => `${a.phase} (${a.side}): ${p}`));
  const allClaimIds = prior.flatMap((t) => t.claims.map((c) => c.id));
  const provider = getProvider();
  const index = snapshotIndex(snap);
  const validIds = new Set(index.map((i) => i.evidenceId));

  await emit(sessionId, 'turn_started', { phase: 'JUDGING', actor: 'judge' });
  const started = Date.now();
  const { system, user } = buildJudgePrompt({ topic, evidence, model, turns: prior, audit: auditLines });
  const context: FixtureContext = { kind: 'judge', actor: 'judge', phase: 'JUDGING', evidence, opponentClaimIds: [], allClaimIds };
  const out = await callWithRetry(sessionId, provider, 'judge', async () => {
    const r = await provider.generate({ system, user, schemaName: 'judge_verdict', jsonSchema: JudgeJsonSchema, maxOutputTokens: Number(process.env.LLM_MAX_OUTPUT_TOKENS_JUDGE ?? 4000), context });
    const parsed = JudgeOutputSchema.safeParse(r.json);
    if (!parsed.success) throw new LlmError(`Verdict failed schema validation: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`, true);
    return { parsed: parsed.data, usage: { inputTokens: r.inputTokens, outputTokens: r.outputTokens, model: r.model } };
  });
  const j = out.parsed;
  const final = finalizeScores(j.scores, j.winner, audits);
  // Server-detected unsupported claims are always listed, whatever the Judge said.
  const serverUnsupported = audits.flatMap((a) => a.claims.filter((c) => c.status === 'unsupported').map((c) => ({ claimId: c.id, reason: `Server audit: ${c.problems.join('; ')}`, source: 'server' })));
  const judgeUnsupported = j.unsupportedClaims.filter((u) => allClaimIds.includes(u.claimId)).map((u) => ({ ...u, source: 'judge' }));
  const unsupported = [...serverUnsupported, ...judgeUnsupported.filter((u) => !serverUnsupported.some((s) => s.claimId === u.claimId))];
  const decisive = j.decisiveEvidenceIds.filter((id) => validIds.has(id));
  const judgeNumbers = verifyTurn({ beats: [{ text: j.speech, claimId: null }], claims: [{ id: 'J', text: 'verdict', evidenceIds: decisive, nature: 'inference', rebuttedClaimId: null }], chartCue: null, modelInputRefs: [] },
    { snapshot: index, metricKeyOf: () => null, claimPrefix: 'J', opponentClaimIds: [], minWords: 0, maxWords: 400, requiresRebuttal: false });

  await db().$transaction(async (tx) => {
    await tx.judgeVerdict.create({
      data: {
        sessionId, winner: final.winner, llmWinner: j.winner, overrideReason: final.overrideReason, scores: final.scores as object, rawScores: j.scores as object,
        penalties: final.penalties as unknown as object, decisiveEvidenceIds: decisive, unsupportedClaims: unsupported as object, verdictRationale: j.verdictRationale,
        inputChallenges: (topic.usesModel ? j.inputChallenges : []) as object, whatWouldChangeMyMind: j.whatWouldChangeMyMind, confidenceLabel: j.confidenceLabel,
        speechText: j.speech, model: out.usage.model, promptVersion: PROMPT_VERSION,
      },
    });
    const beats = splitSentences(j.speech).map((text) => ({ text, claimId: null }));
    const turn = await tx.debateTurn.create({
      data: {
        sessionId, seq: PHASES.length + 1, phase: 'JUDGING', actor: 'judge', speechText: beats.map((b) => b.text).join(' '), beats, claims: [],
        chartCue: decisive[0] ? { evidenceId: decisive[0], chartType: 'stat' } : undefined, modelInputRefs: j.inputChallenges.map((c) => c.input),
        audit: { ...judgeNumbers.audit, scoreNotes: j.scoreNotes } as unknown as object, textHash: sha256(beats.map((b) => b.text).join(' ')),
        model: out.usage.model, promptVersion: PROMPT_VERSION, latencyMs: Date.now() - started, audioStatus: 'PENDING',
      },
    });
    await tx.job.upsert({ where: { kind_refId: { kind: 'audio', refId: turn.id } }, update: {}, create: { kind: 'audio', refId: turn.id } });
  });
  await emit(sessionId, 'verdict', { winner: final.winner });
}

export function splitSentences(text: string): string[] {
  const parts = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Records a step failure: PARTIAL if any turn exists, otherwise FAILED. */
export async function failSession(sessionId: string, err: Error) {
  const s = await db().debateSession.findUnique({ where: { id: sessionId }, include: { _count: { select: { turns: true } } } });
  if (!s) return;
  const terminal = s._count.turns > 0 ? 'PARTIAL' : 'FAILED';
  const reason = err.message.slice(0, 500);
  await db().debateSession.update({ where: { id: sessionId }, data: { status: terminal, failedAtStatus: s.status, failureReason: reason } });
  await emit(sessionId, 'status', { status: terminal, reason, retryable: err instanceof DebateStepError ? err.retryable : true });
}

/** Resumes a FAILED or PARTIAL session from the step that failed. Never touches stored turns. */
export async function resumeSession(sessionId: string) {
  const s = await db().debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (s.status !== 'FAILED' && s.status !== 'PARTIAL') return false;
  await db().debateSession.update({ where: { id: sessionId }, data: { status: s.failedAtStatus ?? 'PENDING', failureReason: null, failedAtStatus: null } });
  await emit(sessionId, 'status', { status: s.failedAtStatus ?? 'PENDING', resumed: true });
  await enqueue('debate', sessionId, { reset: true });
  return true;
}
