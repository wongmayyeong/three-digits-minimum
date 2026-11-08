'use client';

/**
 * Fullscreen debate show. The camera frames the active speaker; evidence for the current claim
 * slides in on the side away from them (right for Bull and Judge, left for Bear). Captions and
 * controls sit at the bottom. Everything is driven by the same playback clock as the inline theatre.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DebateView } from '@/lib/debate/view';
import { formatClock } from '@/lib/playback/timeline';
import { formatValue } from '@/lib/format';
import { getTopic } from '@/lib/topics/topics';
import { claimIndex, computeCast, NAME, ROUND } from './cast';
import { StudioScene } from './stage';
import { IntroTray, ScoreReveal, TurnTray } from './tray';
import { usePlayback, type Segment } from './use-playback';

export function DebateShow({ view, onClose }: { view: DebateView; onClose: () => void }) {
  const reduce = !!useReducedMotion();
  const topic = getTopic(view.topicSlug)!;
  const [captionsOn, setCaptionsOn] = useState(true);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  // Rendered only after a click, so reading the viewport here cannot cause a hydration mismatch.
  const [narrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);

  const segments: Segment[] = useMemo(() => {
    if (!view.snapshot) return [];
    const turns = [...view.turns].sort((a, b) => a.seq - b.seq);
    return [{ key: 'intro', kind: 'intro', turn: null }, ...turns.map((t) => ({ key: t.id, kind: 'turn' as const, turn: t }))];
  }, [view.snapshot, view.turns]);
  const pb = usePlayback(segments, { waitingForMore: false, reducedMotion: reduce });
  const allClaims = useMemo(() => claimIndex(view), [view]);
  const { cast, judgeScene, afterVerdict } = computeCast(view, pb, false, allClaims);
  const turn = pb.turn;
  const progress = pb.duration ? pb.time / pb.duration : 0;

  // Start playing as soon as the show opens (captions only; sound is opt-in).
  const { go } = pb;
  useEffect(() => { go(0, true); }, [go]);

  // Esc closes from anywhere on the page, regardless of focus.
  useEffect(() => {
    const onDocKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onDocKey);
    return () => document.removeEventListener('keydown', onDocKey);
  }, [onClose]);

  // Lock page scroll and move focus into the dialog while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); pb.toggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); pb.go(pb.index + 1, pb.playing); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); pb.go(pb.index - 1, pb.playing); }
  };

  const introIds = (view.replay.find((r) => r.kind === 'intro')?.payload.revealEvidenceIds as string[] | undefined)
    ?? topic.evidenceRequirements.flatMap((r) => r.evidenceIds).filter((id) => view.snapshot?.items.some((i) => i.evidenceId === id && i.available)).slice(0, 6);
  const side: 'left' | 'right' = cast.active === 'bear' ? 'left' : 'right';
  const caption = turn ? pb.phrase?.text ?? '' : 'Both sides receive the same frozen evidence. Neither can fetch anything new during the debate.';
  const panelKey = pb.seg?.kind === 'intro' ? 'intro' : `${turn?.id}-${side}`;

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Debate" onKeyDown={onKey}
      className="fixed inset-0 z-[60] flex flex-col bg-black text-fg outline-none"
      initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div className="relative shrink-0" style={{ width: 'max(100vw, calc((100dvh - 10rem) * 1.777))' }}>
          <StudioScene cast={cast} judgeScene={judgeScene} zoom centered={narrow} />
        </div>

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={turn?.phase ?? 'intro'} className="chip border-line-strong bg-black/60 text-fg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {turn ? ROUND[turn.phase] ?? turn.phase : 'Evidence reveal'}
              </motion.span>
            </AnimatePresence>
            <span className="chip bg-black/60">AI-generated debate</span>
            {view.synthetic && <span className="chip border-amber text-amber">Synthetic test run</span>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-line-strong bg-black/60 px-3 text-sm hover:bg-white/5" aria-label="Close the debate (Esc)">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" /></svg>
            Close
          </button>
        </div>

        <AnimatePresence mode="wait">
          {pb.seg?.kind === 'intro' && view.snapshot ? (
            <motion.aside key="intro-strip" aria-label="Evidence snapshot" className="absolute inset-x-4 bottom-3 z-10 mx-auto max-w-4xl rounded-[var(--radius-lg)] border hairline bg-[rgb(8_13_11/0.88)] p-3 backdrop-blur-md"
              initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: 16 }} transition={{ duration: 0.4 }}>
              <IntroStrip view={view} ids={introIds} progress={progress} />
            </motion.aside>
          ) : (
          <motion.aside key={panelKey} aria-label={judgeScene ? 'Judge’s review' : 'Evidence'}
            className={`absolute bottom-3 top-16 z-10 hidden w-[min(400px,34vw)] overflow-y-auto rounded-[var(--radius-lg)] border hairline bg-[rgb(8_13_11/0.88)] p-4 backdrop-blur-md md:block ${side === 'left' ? 'left-4' : 'right-4'}`}
            initial={reduce ? false : { opacity: 0, x: side === 'left' ? -40 : 40 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: side === 'left' ? -24 : 24 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <p className="eyebrow mb-3">{judgeScene ? 'Judge’s review' : turn ? `${NAME[turn.actor]} · evidence` : 'Evidence snapshot'}</p>
            {!view.snapshot ? null : pb.seg?.kind === 'intro' ? (
              <IntroTray snapshot={view.snapshot} revealIds={introIds} progress={progress} />
            ) : judgeScene && view.verdict ? (
              <div className="space-y-3">
                <ScoreReveal verdict={view.verdict} progress={progress} showVerdict={afterVerdict} />
                <TurnTray turn={turn!} claimId={null} snapshot={view.snapshot} allClaims={allClaims} />
              </div>
            ) : turn ? (
              <TurnTray turn={turn} claimId={pb.claimId} snapshot={view.snapshot} allClaims={allClaims} />
            ) : null}
          </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <div className="relative border-t hairline bg-black/90 px-4 pb-4 pt-3 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <MobileEvidence view={view} turnId={turn?.id ?? null} claimId={pb.claimId} />
          <p className="min-h-[3rem] text-center text-base leading-snug sm:text-xl" aria-live="off">
            {turn && <span className={`mr-2 text-xs font-[640] uppercase tracking-[0.14em] ${turn.actor === 'bull' ? 'text-mint' : turn.actor === 'bear' ? 'text-coral' : 'text-fg'}`}>{NAME[turn.actor]}</span>}
            {captionsOn ? caption : <span className="text-sm text-muted">Captions off</span>}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <ShowButton label="Previous turn" onClick={() => pb.go(pb.index - 1, pb.playing)} disabled={pb.index === 0}><path d="M3 2v10M12 2 5 7l7 5z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" /></ShowButton>
            <ShowButton label={pb.playing ? 'Pause' : 'Play'} onClick={pb.toggle} primary>
              {pb.playing ? <path d="M4 2h2v10H4zM8 2h2v10H8z" fill="currentColor" /> : <path d="M3.5 1.5v11l9-5.5z" fill="currentColor" />}
            </ShowButton>
            <ShowButton label="Skip to next turn" onClick={() => pb.go(pb.index + 1, pb.playing)} disabled={pb.index >= segments.length - 1}><path d="M11 2v10M2 2l7 5-7 5z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" /></ShowButton>
            <span className="num mx-1 text-xs text-muted">{formatClock(pb.time)} / {formatClock(pb.duration)}</span>
            <button type="button" className={`chip h-9 px-3 ${pb.sound === 'on' ? 'border-mint text-mint' : ''}`} aria-pressed={pb.sound === 'on'} onClick={() => pb.setSound(pb.sound === 'on' ? 'off' : 'on')}>{pb.sound === 'on' ? 'Sound on' : 'Sound off'}</button>
            <button type="button" className={`chip h-9 px-3 ${captionsOn ? 'text-fg' : ''}`} aria-pressed={captionsOn} onClick={() => setCaptionsOn(!captionsOn)}>CC</button>
            <label className="sr-only" htmlFor="show-speed">Playback speed</label>
            <select id="show-speed" value={pb.speed} onChange={(e) => pb.setSpeed(Number(e.target.value))} className="chip h-9 bg-transparent px-2">
              {[1, 1.25, 1.5].map((s) => <option key={s} value={s} className="bg-raised">{s}x</option>)}
            </select>
          </div>
          <ol className="mt-3 flex gap-1" aria-label="Turns">
            {segments.map((s, i) => {
              const role = s.turn?.actor;
              const color = role === 'bull' ? 'bg-mint' : role === 'bear' ? 'bg-coral' : role === 'judge' ? 'bg-fg' : 'bg-fg-2';
              return (
                <li key={s.key} className="flex-1">
                  <button type="button" onClick={() => pb.go(i, true)} className="block w-full py-1.5" aria-label={`Go to ${s.kind === 'intro' ? 'evidence reveal' : `${ROUND[s.turn!.phase]} (${NAME[role!]})`}`} aria-current={i === pb.index ? 'step' : undefined}>
                    <span className={`block h-1 rounded-full ${color} ${i === pb.index ? 'opacity-100' : i < pb.index ? 'opacity-45' : 'opacity-20'}`} />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </motion.div>
  );
}

function ShowButton({ label, onClick, disabled, primary, children }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={`inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] transition-colors disabled:opacity-35 ${primary ? 'bg-mint text-mint-ink hover:bg-[#3ff3b2]' : 'border border-line-strong hover:bg-white/5'}`}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">{children}</svg>
    </button>
  );
}

/** Phones: the current claim and its first evidence figure, in place of the side panel. */
function MobileEvidence({ view, turnId, claimId }: { view: DebateView; turnId: string | null; claimId: string | null }) {
  const turn = view.turns.find((t) => t.id === turnId);
  const claim = turn?.claims.find((c) => c.id === claimId) ?? null;
  const ev = claim?.evidenceIds[0] ? view.snapshot?.items.find((i) => i.evidenceId === claim.evidenceIds[0]) : null;
  if (!claim) return null;
  return (
    <div className="mb-2 rounded-[var(--radius-md)] border hairline bg-raised px-3 py-2 text-xs md:hidden">
      <p className="text-fg-2">{claim.text}</p>
      {ev && <p className="mt-1 text-muted"><span className="num text-fg">{ev.valueText ? 'see source' : formatValue(ev.value, ev.unit)}</span> · {ev.label} · {ev.sourceName}</p>}
    </div>
  );
}

/** Opening scene: snapshot time and the first evidence figures, along the studio floor. */
function IntroStrip({ view, ids, progress }: { view: DebateView; ids: string[]; progress: number }) {
  const items = ids.map((id) => view.snapshot!.items.find((i) => i.evidenceId === id)).filter((x): x is NonNullable<typeof x> => !!x);
  const shown = Math.max(1, Math.ceil(progress * items.length * 1.15));
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <div className="min-w-[160px] flex-1 px-2 py-1">
        <p className="eyebrow">Evidence frozen</p>
        <p className="mt-1 text-sm text-fg">{new Date(view.snapshot!.cutoffAt).toUTCString().slice(5, 22)} UTC</p>
        <p className="mt-0.5 text-xs text-muted">{view.snapshot!.items.filter((i) => i.available).length} of {view.snapshot!.items.length} items available</p>
      </div>
      {items.slice(0, Math.min(shown, 4)).map((e) => (
        <motion.div key={e.evidenceId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="min-w-[140px] flex-1 rounded-[var(--radius-sm)] border hairline bg-raised px-3 py-2">
          <p className="line-clamp-1 text-xs text-muted">{e.label}</p>
          <p className="num mt-1 text-base text-fg">{e.valueText ? 'text' : formatValue(e.value, e.unit)}</p>
        </motion.div>
      ))}
    </div>
  );
}
