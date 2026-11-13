'use client';

/**
 * Full-width debate section: the studio with the cast at rest as the background, a dark overlay, a title and one
 * action. "Watch the debate" opens the show full screen, above the whole page (rendered into document.body so the
 * site header cannot sit on top of it); closing returns here.
 */
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import type { MouthShape, Role, VisualState } from './characters/rigs';
import { DebateShow } from './theatre/debate-show';
import { StudioScene } from './theatre/stage';
import type { DebateView } from '@/lib/debate/view';

const noop = () => () => {};

export function DebateBand({ episode }: { episode: DebateView | null }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [beat, setBeat] = useState(0);
  // False during server render and hydration, true afterwards: the portal target exists only in the browser.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (reduce || open) return;
    const t = setInterval(() => setBeat((b) => (b + 1) % 6), 2600);
    return () => clearInterval(t);
  }, [reduce, open]);

  const states: Record<Role, VisualState> = { bull: beat === 1 ? 'thinking' : 'idle', bear: beat === 3 ? 'thinking' : 'idle', judge: beat === 5 ? 'thinking' : 'idle' };
  const mouths: Record<Role, MouthShape> = { bull: 'closed', bear: 'closed', judge: 'closed' };

  return (
    <section id="debate" aria-labelledby="debate-h" className="section-gap relative isolate overflow-hidden border-y hairline bg-black">
      <div aria-hidden="true" className="absolute inset-0 flex items-end justify-center">
        <div className="w-full min-w-[900px] max-w-none">
          <StudioScene cast={{ active: null, states, mouths, look: { bull: 0.8, bear: -0.8, judge: 0 } }} />
        </div>
      </div>

      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgb(3_5_4/0.86)_0%,rgb(3_5_4/0.72)_55%,rgb(3_5_4/0.5)_100%)] backdrop-blur-[1.5px]" />
        <div className="relative mx-auto flex min-h-[min(78dvh,680px)] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
          <p className="eyebrow mb-4 text-mint">The debate</p>
          <h2 id="debate-h" className="display-l text-balance">Bull versus Bear, on the same evidence</h2>
          <p className="lead mt-5 max-w-2xl">Bull argues for three digits. Bear argues how far the evidence really goes. Both cite one frozen snapshot of this research, every number is checked by code, and a Judge scores the arguments, not the investment.</p>
          <div className="mt-9">
            {episode ? (
              <button type="button" className="btn btn-primary h-12 px-7 text-base" onClick={() => setOpen(true)} disabled={open}>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
                Watch the debate
              </button>
            ) : (
              <p className="text-sm text-muted">The first episode appears here once it is generated from a frozen snapshot of the research.</p>
            )}
          </div>
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && episode && <DebateShow view={episode} onClose={() => setOpen(false)} />}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
