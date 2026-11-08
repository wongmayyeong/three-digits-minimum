'use client';

import Link from 'next/link';
import { useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Role } from '@/components/characters/rigs';
import { Notice } from '@/components/ui';
import { STATUS_LABEL, type DebateStatus } from '@/lib/debate/phases';
import type { DebateView } from '@/lib/debate/view';
import { claimIndex, computeCast, NAME, ROUND } from './cast';
import { formatClock } from '@/lib/playback/timeline';
import { getTopic } from '@/lib/topics/topics';
import { DeltaPanel, FailurePanel, ResearchProgress, SnapshotPanel, Transcript, VerdictDetails } from './panels';
import { Stage } from './stage';
import { IntroTray, ScoreReveal, TurnTray } from './tray';
import { useDebateLive } from './use-debate-live';
import { usePlayback, type Segment } from './use-playback';

const TERMINAL = new Set(['COMPLETE', 'FAILED', 'PARTIAL']);

export function Theatre({ initial, variant = 'full' }: { initial: DebateView; variant?: 'full' | 'embed' }) {
  const reduce = !!useReducedMotion();
  const { view, fetches, activity, connection, refetch } = useDebateLive(initial);
  const topic = getTopic(view.topicSlug)!;
  const [captionsOn, setCaptionsOn] = useState(true);
  const [userStarted, setStarted] = useState(false);
  // Live debates count as started; completed replays wait for the viewer to press play.
  const started = userStarted || initial.status !== 'COMPLETE';
  const autoplayed = useRef(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const segments: Segment[] = useMemo(() => {
    if (!view.snapshot) return [];
    const turns = [...view.turns].sort((a, b) => a.seq - b.seq);
    return [{ key: 'intro', kind: 'intro', turn: null }, ...turns.map((t) => ({ key: t.id, kind: 'turn' as const, turn: t }))];
  }, [view.snapshot, view.turns]);

  const generating = !TERMINAL.has(view.status);
  const pb = usePlayback(segments, { waitingForMore: generating, reducedMotion: reduce });

  // Live debates start playing (muted captions) as soon as the first turn exists.
  const { go } = pb;
  useEffect(() => {
    if (!autoplayed.current && initial.status !== 'COMPLETE' && view.turns.length > 0) { autoplayed.current = true; go(1, true); }
  }, [view.turns.length, initial.status, go]);

  const allClaims = useMemo(() => claimIndex(view), [view]);
  const turn = pb.turn;
  const activeRole: Role | null = turn ? turn.actor : null;
  const progress = pb.duration ? pb.time / pb.duration : 0;
  const { cast, judgeScene, afterVerdict } = computeCast(view, pb, generating, allClaims);

  // Keyboard: Space/K play-pause, arrows seek 5s, Shift+arrows change turn.
  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); if (!started) setStarted(true); pb.toggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (e.shiftKey) pb.go(pb.index + 1, pb.playing); else pb.seek(pb.time + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (e.shiftKey) pb.go(pb.index - 1, pb.playing); else pb.seek(pb.time - 5); }
  };

  const introIds = (view.replay.find((r) => r.kind === 'intro')?.payload.revealEvidenceIds as string[] | undefined)
    ?? topic.evidenceRequirements.flatMap((r) => r.evidenceIds).filter((id) => view.snapshot?.items.some((i) => i.evidenceId === id && i.available)).slice(0, 6);

  const roundLabel = turn ? ROUND[turn.phase] ?? turn.phase : view.snapshot ? 'Evidence reveal' : STATUS_LABEL[view.status as DebateStatus] ?? view.status;
  const caption = turn ? pb.phrase?.text ?? null : view.snapshot ? 'Both sides receive the same frozen evidence. Neither can fetch anything new during the debate.' : 'Collecting live data before the debate begins.';
  const audioMissingForTurn = turn && pb.sound === 'on' && !turn.audio;

  return (
    <div onKeyDown={onKey} className="outline-none">
      {view.synthetic && (
        <div className="mb-4"><Notice tone="warn" title="SYNTHETIC TEST RUN">This debate was produced by the local test fixture, not by an AI model. Its text is templated and its verdict is meaningless. It is excluded from the public library.</Notice></div>
      )}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <section aria-label="Debate stage" className="space-y-3">
          <div className="relative">
            <Stage cast={cast} judgeScene={judgeScene} roundLabel={roundLabel} caption={caption} captionsOn={captionsOn} speakerLabel={activeRole ? NAME[activeRole] : null}
              badge={<span className="chip bg-[rgb(6_10_8/0.6)]" title="All arguments, voices and scores are AI-generated from the frozen snapshot">AI-generated debate</span>} />
            {!started && view.status === 'COMPLETE' && segments.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] bg-[rgb(6_10_8/0.55)]">
                <button type="button" className="btn btn-primary h-12 px-6 text-base" onClick={() => { setStarted(true); pb.go(0, true); }} autoFocus>
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
                  Play replay
                </button>
              </div>
            )}
          </div>
          <Transport pb={pb} segments={segments} captionsOn={captionsOn} setCaptionsOn={setCaptionsOn} onFirstPlay={() => setStarted(true)}
            generating={generating} onTranscript={() => transcriptRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })} />
          {pb.audioError && <p role="status" className="text-xs text-amber">{pb.audioError}</p>}
          {audioMissingForTurn && <AudioNote view={view} turnId={turn!.id} status={turn!.audioStatus} error={turn!.audioError} onRetry={refetch} usingDevice={pb.clock === 'device'} />}
        </section>

        <aside aria-label="Evidence tray" className="panel min-h-[320px] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="eyebrow">{judgeScene ? 'Judge’s review' : 'Evidence tray'}</p>
            <span className="text-[0.6875rem] text-muted">{connection === 'live' ? 'Live updates' : connection === 'polling' ? 'Updating (polling)' : view.status === 'COMPLETE' ? 'Replay from stored data' : ''}</span>
          </div>
          {!view.snapshot || (generating && !view.turns.length && pb.index === 0) ? (
            view.snapshot ? (
              <div className="space-y-5"><IntroTray snapshot={view.snapshot} revealIds={introIds} progress={1} /><ResearchProgress view={view} fetches={fetches} activity={activity} /></div>
            ) : <ResearchProgress view={view} fetches={fetches} activity={activity} />
          ) : pb.seg?.kind === 'intro' ? (
            <IntroTray snapshot={view.snapshot} revealIds={introIds} progress={progress} />
          ) : judgeScene && view.verdict ? (
            <div className="space-y-3">
              <ScoreReveal verdict={view.verdict} progress={progress} showVerdict={afterVerdict} />
              <TurnTray turn={turn!} claimId={null} snapshot={view.snapshot} allClaims={allClaims} />
            </div>
          ) : turn ? (
            <TurnTray turn={turn} claimId={pb.claimId} snapshot={view.snapshot} allClaims={allClaims} />
          ) : null}
          {generating && view.turns.length > 0 && activity && (
            <p className="mt-4 border-t hairline pt-3 text-xs text-muted" aria-live="polite"><span className="nb-live-dot mr-1.5 inline-block size-1.5 rounded-full bg-mint align-middle" aria-hidden="true" />Generating {activity.phase.replace('_', ' ').toLowerCase()}…</p>
          )}
        </aside>
      </div>

      {(view.status === 'FAILED' || view.status === 'PARTIAL') && <div className="mt-5"><FailurePanel view={view} onRetried={refetch} /></div>}

      {variant === 'embed' && (
        <p className="mt-3 text-sm"><Link href={`/debates/${view.id}`} className="text-mint">Full transcript, scorecard and cited evidence →</Link></p>
      )}
      {variant === 'full' && <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <section ref={transcriptRef} aria-labelledby="tr-h" className="scroll-mt-20">
          <h2 id="tr-h" className="mb-5 text-lg font-[600]">Transcript</h2>
          {view.turns.length ? <Transcript turns={[...view.turns].sort((a, b) => a.seq - b.seq)} activeIndex={turn?.seq ?? -1} onJump={(seq) => { setStarted(true); pb.go(segments.findIndex((s) => s.turn?.seq === seq), true); }} />
            : <p className="text-sm text-muted">{generating ? 'The transcript appears here turn by turn as it is generated.' : 'No turns were generated.'}</p>}
        </section>
        <div className="space-y-10">
          {view.verdict && (
            <section aria-labelledby="v-h">
              <h2 id="v-h" className="mb-1 text-lg font-[600]">Verdict</h2>
              <p className="mb-4 text-sm text-muted">The argument ends. The evidence remains.</p>
              <ScoreReveal verdict={view.verdict} progress={1} showVerdict />
              <div className="mt-6"><VerdictDetails view={view} /></div>
            </section>
          )}
          {view.status === 'COMPLETE' && (
            <section aria-labelledby="next-h" className="panel space-y-4 p-5">
              <h2 id="next-h" className="text-base font-[600]">Episode record</h2>
              <div className="flex flex-wrap gap-3">
                <Link href={`/debates/${view.id}/report`} className="btn btn-ghost">Read the thesis report</Link>
                <Link href="/#verdict" className="btn btn-ghost">See the live verdict</Link>
              </div>
              <p className="text-xs leading-relaxed text-muted">This episode and its snapshot never change. A new episode is generated from a fresh snapshot only when the verdict changes.</p>
              {view.rematchIds.length > 0 && <p className="text-xs text-muted">Later episodes: {view.rematchIds.map((r, i) => <Link key={r} href={`/debates/${r}`} className="link mr-2">#{i + 1}</Link>)}</p>}
            </section>
          )}
          {view.parentId && view.snapshot && (
            <section aria-labelledby="d-h">
              <h2 id="d-h" className="mb-3 text-lg font-[600]">What changed since the previous episode</h2>
              <DeltaPanel debateId={view.id} />
            </section>
          )}
          {view.snapshot && (
            <section aria-labelledby="s-h">
              <h2 id="s-h" className="mb-3 text-lg font-[600]">Evidence snapshot</h2>
              <SnapshotPanel snapshot={view.snapshot} />
              <p className="mt-3 text-xs text-muted">Model {view.aiModel} via {view.aiProvider} · prompts {view.promptVersion}{view.voiceProvider !== 'none' ? ` · voices ${view.voiceProvider}` : ''}</p>
            </section>
          )}
        </div>
      </div>}
    </div>
  );
}

export function Transport({ pb, segments, captionsOn, setCaptionsOn, onFirstPlay, generating, onTranscript }: {
  pb: ReturnType<typeof usePlayback>; segments: Segment[]; captionsOn: boolean; setCaptionsOn: (b: boolean) => void; onFirstPlay: () => void; generating: boolean; onTranscript: () => void;
}) {
  const disabled = segments.length === 0;
  const clockLabel = pb.clock === 'audio' ? `AI voice${pb.alignmentKind === 'character' ? ' · lip sync approximated from character timing' : ''}` : pb.clock === 'device' ? 'Your device’s browser voice (synthetic)' : 'Captions only';
  return (
    <div className="panel p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label={pb.playing ? 'Pause' : 'Play'} onClick={() => { onFirstPlay(); pb.toggle(); }} disabled={disabled} primary>
          {pb.playing ? <path d="M4 2h2v10H4zM8 2h2v10H8z" fill="currentColor" /> : <path d="M3.5 1.5v11l9-5.5z" fill="currentColor" />}
        </IconButton>
        <IconButton label="Previous turn" onClick={() => pb.go(pb.index - 1, pb.playing)} disabled={disabled || pb.index === 0}><path d="M3 2v10M12 2 5 7l7 5z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" /></IconButton>
        <IconButton label="Replay this turn" onClick={() => { onFirstPlay(); pb.seek(0); pb.setPlaying(true); }} disabled={disabled}><path d="M2.5 7a4.5 4.5 0 1 0 1.4-3.3M2.5 1.5v3h3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></IconButton>
        <IconButton label="Skip to next turn" onClick={() => pb.go(pb.index + 1, pb.playing)} disabled={disabled || pb.index >= segments.length - 1}><path d="M11 2v10M2 2l7 5-7 5z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" /></IconButton>
        <span className="num ml-1 text-xs text-muted" aria-live="off">{formatClock(pb.time)} / {formatClock(pb.duration)}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" className={`chip h-9 px-3 ${pb.sound === 'on' ? 'border-mint text-mint' : ''}`} aria-pressed={pb.sound === 'on'} onClick={() => pb.setSound(pb.sound === 'on' ? 'off' : 'on')}>
            {pb.sound === 'on' ? 'Sound on' : 'Sound off'}
          </button>
          <button type="button" className={`chip h-9 px-3 ${captionsOn ? 'border-line-strong text-fg' : ''}`} aria-pressed={captionsOn} onClick={() => setCaptionsOn(!captionsOn)}>CC</button>
          <label className="sr-only" htmlFor="speed">Playback speed</label>
          <select id="speed" value={pb.speed} onChange={(e) => pb.setSpeed(Number(e.target.value))} className="chip h-9 bg-transparent px-2">
            {[1, 1.25, 1.5].map((s) => <option key={s} value={s} className="bg-raised">{s}x</option>)}
          </select>
          <button type="button" className="chip h-9 px-3" onClick={onTranscript}>Transcript</button>
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor="seek" className="sr-only">Seek within this turn</label>
        <input id="seek" type="range" min={0} max={Math.max(0.1, pb.duration)} step={0.1} value={Math.min(pb.time, pb.duration)} onChange={(e) => pb.seek(Number(e.target.value))} disabled={disabled}
          className="h-1.5 w-full cursor-pointer accent-[var(--color-mint)]" />
      </div>
      <ol className="mt-3 flex gap-1" aria-label="Turns">
        {segments.map((s, i) => {
          const role = s.turn?.actor;
          const color = role === 'bull' ? 'bg-mint' : role === 'bear' ? 'bg-coral' : role === 'judge' ? 'bg-fg' : 'bg-fg-2';
          const label = s.kind === 'intro' ? 'Evidence reveal' : `${ROUND[s.turn!.phase] ?? s.turn!.phase} (${NAME[role!]})`;
          return (
            <li key={s.key} className="flex-1">
              <button type="button" onClick={() => { onFirstPlay(); pb.go(i, true); }} className="group block w-full py-1.5" aria-label={`Go to ${label}`} aria-current={i === pb.index ? 'step' : undefined} title={label}>
                <span className={`block h-1 rounded-full ${color} ${i === pb.index ? 'opacity-100' : i < pb.index ? 'opacity-45' : 'opacity-20'} group-hover:opacity-80`} />
              </button>
            </li>
          );
        })}
        {generating && Array.from({ length: Math.max(0, 8 - segments.length) }).map((_, i) => <li key={`p${i}`} className="flex-1 py-1.5" aria-hidden="true"><span className="block h-1 rounded-full bg-line" /></li>)}
      </ol>
      <p className="mt-1 text-[0.6875rem] text-muted">{clockLabel}. Keys: Space play/pause, ←/→ seek 5s, Shift+←/→ change turn.</p>
    </div>
  );
}

function IconButton({ label, onClick, disabled, primary, children }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={`inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] transition-colors disabled:opacity-35 ${primary ? 'bg-mint text-mint-ink hover:bg-[#3ff3b2]' : 'border border-line-strong text-fg hover:bg-[rgb(255_255_255/0.04)]'}`}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">{children}</svg>
    </button>
  );
}

function AudioNote({ view, turnId, status, error, onRetry, usingDevice }: { view: DebateView; turnId: string; status: string; error: string | null; onRetry: () => void; usingDevice: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fallback = usingDevice ? 'Playing with your device voice instead.' : 'Showing captions instead.';
  if (status === 'PENDING') return <p className="text-xs text-muted">AI voice for this turn is still being produced. {fallback}</p>;
  if (status === 'UNAVAILABLE') return <p className="text-xs text-muted">AI voices are not configured on this deployment. {fallback}</p>;
  return (
    <p className="text-xs text-amber">
      AI voice failed for this turn{error ? ` (${error.slice(0, 100)})` : ''}. {fallback}{' '}
      <button type="button" className="link" disabled={busy} onClick={async () => {
        setBusy(true);
        const r = await fetch(`/api/debates/${view.id}/turns/${turnId}/audio`, { method: 'POST' }).catch(() => null);
        setBusy(false);
        if (!r?.ok) { const j = await r?.json().catch(() => null); setMsg(j?.error?.message ?? 'Retry failed.'); } else { setMsg('Voice retry queued.'); onRetry(); }
      }}>{busy ? 'Retrying…' : 'Retry voice'}</button>
      {msg && <span className="ml-2 text-muted">{msg}</span>}
    </p>
  );
}
