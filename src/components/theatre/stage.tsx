'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CharacterRig, type MouthShape, type Role, type VisualState } from '@/components/characters/rigs';
import { StarField } from '@/components/brand';

export interface StageCast {
  active: Role | null;
  states: Record<Role, VisualState>;
  mouths: Record<Role, MouthShape>;
  look: Record<Role, number>;
}

const NAMES: Record<Role, string> = { bull: 'Bull', bear: 'Bear', judge: 'Judge' };
const SPOT_X: Record<Role, string> = { bull: '18%', judge: '50%', bear: '82%' };

export function Stage({ cast, judgeScene, roundLabel, caption, captionsOn, speakerLabel, badge }: {
  cast: StageCast; judgeScene: boolean; roundLabel: string; caption: string | null; captionsOn: boolean; speakerLabel: string | null; badge: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const order: Role[] = ['bull', 'judge', 'bear'];
  const t = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 140, damping: 20 };
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border hairline bg-surface">
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: judgeScene ? 0.35 : 1 }} transition={{ duration: reduce ? 0 : 0.6 }}>
        <StarField count={20} seed={21} />
      </motion.div>
      {order.map((r) => (
        <motion.div
          key={r}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 h-[85%] w-[46%] -translate-x-1/2"
          style={{ left: SPOT_X[r], background: `radial-gradient(ellipse at 50% 100%, ${r === 'bear' ? 'rgb(255 121 102 / 0.13)' : 'rgb(0 236 151 / 0.13)'}, transparent 62%)` }}
          initial={false}
          animate={{ opacity: cast.active === r ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.45 }}
        />
      ))}

      <div className="relative flex items-center justify-between gap-2 px-3 pt-3 sm:px-5 sm:pt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={roundLabel} className="chip border-line-strong bg-[rgb(6_10_8/0.6)] text-fg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}>
            {roundLabel}
          </motion.span>
        </AnimatePresence>
        {badge}
      </div>

      <div className="relative grid grid-cols-3 items-end px-1 pt-2 sm:px-6">
        {order.map((r) => {
          const isActive = cast.active === r;
          const center = r === 'judge';
          const scale = isActive ? (center ? 1.18 : 1.1) : cast.active ? (center && !judgeScene ? 0.74 : 0.86) : center ? 0.8 : 0.94;
          const opacity = cast.active && !isActive ? (judgeScene ? 0.5 : 0.62) : 1;
          return (
            <motion.div key={r} className="flex justify-center" initial={false} animate={{ scale, opacity, y: center && !judgeScene ? -6 : 0 }} transition={t} style={{ transformOrigin: '50% 100%' }}>
              <CharacterRig role={r} state={cast.states[r]} mouth={cast.mouths[r]} lookAt={cast.look[r]} className="w-full max-w-[230px]" title={`${NAMES[r]}, ${cast.states[r]}`} />
            </motion.div>
          );
        })}
      </div>

      <div className="relative border-t hairline bg-[rgb(6_10_8/0.72)] px-4 py-3 sm:px-6 sm:py-4">
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
