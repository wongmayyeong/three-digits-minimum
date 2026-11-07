'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { CharacterRig, type Role, type VisualState } from './characters/rigs';
import { StarField } from './brand';

const CAST: { role: Role; name: string; line: string }[] = [
  { role: 'bull', name: 'Bull', line: 'Argues the strongest positive case' },
  { role: 'judge', name: 'Judge', line: 'Scores evidence, not confidence' },
  { role: 'bear', name: 'Bear', line: 'Stress-tests every assumption' },
];

/** Arena idle scene: the cast at rest. Glances rotate slowly; no speech is implied. */
export function ArenaIdle() {
  const reduce = useReducedMotion();
  const [glance, setGlance] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setGlance((g) => (g + 1) % 4), 3200);
    return () => clearInterval(t);
  }, [reduce]);
  const states: Record<Role, VisualState> = { bull: glance === 1 ? 'thinking' : 'idle', bear: glance === 3 ? 'thinking' : 'idle', judge: 'idle' };
  const look: Record<Role, number> = { bull: glance === 2 ? 0.2 : 0.8, bear: glance === 0 ? -0.2 : -0.8, judge: glance % 2 ? -0.6 : 0.6 };
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border hairline bg-surface">
      <StarField count={22} seed={11} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgb(0_236_151/0.10),transparent_65%)]" aria-hidden="true" />
      <div className="relative grid grid-cols-3 items-end gap-1 px-3 pt-10 sm:gap-3 sm:px-6">
        {CAST.map((c, i) => (
          <motion.figure
            key={c.role}
            className={`flex flex-col items-center ${c.role === 'judge' ? '-translate-y-3' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <CharacterRig role={c.role} state={states[c.role]} mouth="closed" lookAt={look[c.role]} className="w-full max-w-[200px]" title={`${c.name}, idle`} />
          </motion.figure>
        ))}
      </div>
      <div className="relative grid grid-cols-3 gap-1 border-t hairline px-3 py-3 sm:gap-3 sm:px-6">
        {CAST.map((c) => (
          <div key={c.role} className="text-center">
            <p className={`text-sm font-[600] ${c.role === 'bull' ? 'text-mint' : c.role === 'bear' ? 'text-coral' : 'text-fg'}`}>{c.name}</p>
            <p className="mt-0.5 hidden text-xs text-muted sm:block">{c.line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
