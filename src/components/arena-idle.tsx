'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { type MouthShape, type Role, type VisualState } from './characters/rigs';
import { StudioScene } from './theatre/stage';

const CAST: { role: Role; name: string; line: string }[] = [
  { role: 'bull', name: 'Bull', line: 'Argues the strongest positive case' },
  { role: 'judge', name: 'Judge', line: 'Scores evidence, not confidence' },
  { role: 'bear', name: 'Bear', line: 'Stress-tests every assumption' },
];

/** The cast at rest in the studio. Occasional thinking glances; no speech is implied. */
export function ArenaIdle() {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setBeat((g) => (g + 1) % 6), 2600);
    return () => clearInterval(t);
  }, [reduce]);
  const states: Record<Role, VisualState> = { bull: beat === 1 ? 'thinking' : 'idle', bear: beat === 3 ? 'thinking' : 'idle', judge: beat === 5 ? 'thinking' : 'idle' };
  const mouths: Record<Role, MouthShape> = { bull: 'closed', bear: 'closed', judge: 'closed' };
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border hairline bg-surface">
      <StudioScene cast={{ active: null, states, mouths, look: { bull: 0.8, bear: -0.8, judge: 0 } }} />
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
