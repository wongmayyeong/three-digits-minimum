'use client';

/**
 * Home hero: the studio with the cast at rest behind a dark overlay, the thesis question and
 * two actions. "Watch the debate" fades the overlay, pushes the camera into the stage and
 * opens the fullscreen show; closing returns here.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { MouthShape, Role, VisualState } from './characters/rigs';
import { DebateShow } from './theatre/debate-show';
import { StudioScene } from './theatre/stage';
import type { DebateView } from '@/lib/debate/view';

export function HeroDebate({ episode, title, subtitle, verdict, verdictTone, confidence, asOf }: {
  episode: DebateView | null; title: string; subtitle: string; verdict: string | null; verdictTone: 'mint' | 'coral' | 'amber' | 'muted'; confidence: string | null; asOf: string | null;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'entering' | 'show'>('idle');
  const [beat, setBeat] = useState(0);

  // Ambient life while idle: occasional thinking glances, never implied speech.
  useEffect(() => {
    if (reduce || phase !== 'idle') return;
    const t = setInterval(() => setBeat((b) => (b + 1) % 6), 2600);
    return () => clearInterval(t);
  }, [reduce, phase]);
  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('show'), reduce ? 0 : 900);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  const states: Record<Role, VisualState> = { bull: beat === 1 ? 'thinking' : 'idle', bear: beat === 3 ? 'thinking' : 'idle', judge: beat === 5 ? 'thinking' : 'idle' };
  const mouths: Record<Role, MouthShape> = { bull: 'closed', bear: 'closed', judge: 'closed' };
  const tone = { mint: 'text-mint', coral: 'text-coral', amber: 'text-amber', muted: 'text-fg-2' }[verdictTone];

  return (
    <section aria-label="Thesis" className="relative overflow-hidden border-b hairline bg-black">
      <motion.div className="absolute inset-0 flex items-end justify-center" initial={false}
        animate={{ scale: phase === 'idle' ? 1 : 1.18 }} transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: '50% 55%' }}>
        <div className="w-full min-w-[900px] max-w-none">
          <StudioScene cast={{ active: null, states, mouths, look: { bull: 0.8, bear: -0.8, judge: 0 } }} />
        </div>
      </motion.div>

      <motion.div className="relative" initial={false} animate={{ opacity: phase === 'idle' ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.45 }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(4_7_6/0.94)_0%,rgb(4_7_6/0.82)_45%,rgb(4_7_6/0.35)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
        <div className="relative mx-auto flex min-h-[min(88dvh,820px)] max-w-[1320px] flex-col justify-center px-4 py-16 sm:px-6">
          <p className="eyebrow mb-5">NEAR investment thesis · reproducible research</p>
          <h1 className="display-xl max-w-4xl text-balance">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-2 md:text-xl">{subtitle}</p>
          {verdict && (
            <p className="mt-6 text-base">
              <span className="text-muted">Current verdict: </span>
              <span className={`font-[620] ${tone}`}>{verdict}</span>
              {confidence && <span className="text-muted"> · {confidence} confidence</span>}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {episode ? (
              <button type="button" className="btn btn-primary h-12 px-6 text-base" onClick={() => setPhase(reduce ? 'show' : 'entering')} disabled={phase !== 'idle'}>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
                Watch the debate
              </button>
            ) : null}
            <a href="#verdict" className={`btn h-12 px-6 text-base ${episode ? 'btn-ghost bg-black/30' : 'btn-primary'}`}>Read the verdict</a>
          </div>
          <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted">
            {episode ? 'Bull argues the building case, Bear the hype case, from one frozen snapshot of the research below. Every figure they cite is checked by code.' : 'The first debate episode appears here once it is generated from a frozen snapshot of the research below.'}
            {asOf ? ` Data refreshed daily; 90-day window ends ${asOf}.` : ''} Not financial advice. Not affiliated with the NEAR Foundation.
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {phase === 'show' && episode && <DebateShow view={episode} onClose={() => setPhase('idle')} />}
      </AnimatePresence>
    </section>
  );
}
