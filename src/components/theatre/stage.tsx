'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type MouthShape, type Role, type VisualState } from '@/components/characters/rigs';
import { Character } from '@/components/characters/character';

export interface StageCast {
  active: Role | null;
  states: Record<Role, VisualState>;
  mouths: Record<Role, MouthShape>;
  look: Record<Role, number>;
}

const NAMES: Record<Role, string> = { bull: 'Bull', bear: 'Bear', judge: 'Judge' };

/**
 * Where each character stands on the generated studio image (percent of the image).
 * `x` is the centre, `top` is the podium/desk surface the character stands behind, `w` is width.
 * The character's wrapper is clipped at the podium top, so the bust reads as standing behind it.
 */
const SPOT: Record<Role, { x: number; top: number; w: number }> = {
  bull: { x: 16, top: 55.5, w: 23 },
  judge: { x: 50, top: 50, w: 21 },
  bear: { x: 84, top: 55.5, w: 23 },
};
const GLOW: Record<Role, string> = { bull: 'rgb(0 236 151 / 0.22)', judge: 'rgb(242 241 233 / 0.14)', bear: 'rgb(255 121 102 / 0.22)' };

/** The studio scene with the three characters, shared by the live theatre and the idle placeholder. */
export function StudioScene({ cast, judgeScene = false, children }: { cast: StageCast; judgeScene?: boolean; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const order: Role[] = ['bull', 'judge', 'bear'];
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 150, damping: 20 };
  return (
    <div className="relative aspect-[1672/941] w-full overflow-hidden bg-[#060a08]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stage/studio.webp" alt="" className="absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]" draggable={false} />
      <motion.div aria-hidden="true" className="absolute inset-0 bg-[#060a08]" initial={false} animate={{ opacity: judgeScene ? 0.38 : 0.08 }} transition={{ duration: reduce ? 0 : 0.6 }} />
      {order.map((r) => {
        const s = SPOT[r];
        const isActive = cast.active === r;
        const dim = cast.active !== null && !isActive;
        return (
          <div key={r} className="absolute" style={{ left: `${s.x - s.w / 2}%`, width: `${s.w}%`, top: 0, height: `${s.top}%` }}>
            <motion.div aria-hidden="true" className="pointer-events-none absolute -inset-x-[30%] bottom-0 h-[70%]"
              style={{ background: `radial-gradient(ellipse at 50% 85%, ${GLOW[r]}, transparent 65%)` }}
              initial={false} animate={{ opacity: isActive ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.4 }} />
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden">
              <motion.div className="absolute inset-x-0 bottom-[-18%]" initial={false}
                animate={{ scale: isActive ? 1.07 : 1, filter: dim ? `brightness(${judgeScene ? 0.5 : 0.62}) saturate(0.7)` : 'brightness(1) saturate(1)' }}
                transition={spring} style={{ transformOrigin: '50% 100%' }}>
                <Character role={r} state={cast.states[r]} mouth={cast.mouths[r]} lookAt={cast.look[r]} className="w-full" title={`${NAMES[r]}, ${cast.states[r]}`} />
              </motion.div>
            </div>
          </div>
        );
      })}
      {children}
    </div>
  );
}

export function Stage({ cast, judgeScene, roundLabel, caption, captionsOn, speakerLabel, badge }: {
  cast: StageCast; judgeScene: boolean; roundLabel: string; caption: string | null; captionsOn: boolean; speakerLabel: string | null; badge: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border hairline bg-surface">
      <StudioScene cast={cast} judgeScene={judgeScene}>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-3 pt-3 sm:px-5 sm:pt-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={roundLabel} className="chip border-line-strong bg-[rgb(6_10_8/0.75)] text-fg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}>
              {roundLabel}
            </motion.span>
          </AnimatePresence>
          {badge}
        </div>
      </StudioScene>
      <div className="relative border-t hairline bg-[rgb(6_10_8/0.92)] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-h-[3.25rem] items-start gap-3 sm:min-h-[3.5rem]">
          {speakerLabel && (
            <span className={`mt-0.5 shrink-0 text-xs font-[640] uppercase tracking-[0.12em] ${cast.active === 'bull' ? 'text-mint' : cast.active === 'bear' ? 'text-coral' : 'text-fg'}`}>{speakerLabel}</span>
          )}
          <p className="text-[0.9375rem] leading-snug text-fg sm:text-lg" aria-live="off">
            {captionsOn ? (caption ?? '') : <span className="text-sm text-muted">Captions off</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
