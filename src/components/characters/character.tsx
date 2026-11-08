'use client';

/**
 * Character renderer. Uses generated pixel-art pose frames from public/characters/<role>/
 * listed in `sprites.json` (written by scripts/slice-sprites.ts); otherwise falls back to the
 * vector rig. Each role may have its own pose set (6 or 8 frames); missing poses map to the
 * closest available one.
 *
 * Speech: the talk frame alternates with the idle frame from the playback-driven mouth signal,
 * so it stops the moment playback pauses. Each beat opens with a hand gesture (explain / point)
 * supplied by the caller from the same clock. One-shot body motion plays per pose change.
 */
import { motion } from 'motion/react';
import { CharacterRig, type CharacterRigProps, type MouthShape, type VisualState } from './rigs';
import manifest from './sprites.json';

export type Pose = 'idle' | 'talk' | 'explain' | 'point' | 'think' | 'surprised' | 'agree' | 'disagree';

const available = manifest as Record<string, { width: number; height: number; poses: string[] } | undefined>;
const FALLBACK: Record<Pose, Pose[]> = {
  idle: ['idle'], talk: ['talk', 'idle'], explain: ['explain', 'talk'], point: ['point', 'explain', 'talk'],
  think: ['think', 'idle'], surprised: ['surprised', 'idle'], agree: ['agree', 'idle'], disagree: ['disagree', 'idle'],
};

export function poseFor(state: VisualState, mouth: MouthShape, gesture: Pose | null = null): Pose {
  const open = mouth === 'small' || mouth === 'wide' || mouth === 'round';
  switch (state) {
    case 'speaking':
    case 'judging':
      return gesture ?? (open ? 'talk' : 'idle');
    case 'rebutting':
      return gesture ?? (open ? 'talk' : 'disagree');
    case 'thinking':
      return 'think';
    case 'reacting':
      return 'surprised';
    case 'verdict-winning':
      return 'agree';
    case 'verdict-losing':
      return 'disagree';
    default:
      return 'idle';
  }
}

function resolve(pose: Pose, poses: string[]): Pose {
  return FALLBACK[pose].find((p) => poses.includes(p)) ?? 'idle';
}

/** One-shot body motion per pose change; skipped automatically under reduced motion. */
function motionFor(pose: Pose) {
  switch (pose) {
    case 'agree': return { y: [0, 5, 0, 5, 0], x: 0, rotate: 0, transition: { duration: 0.9, ease: 'easeInOut' as const } };
    case 'disagree': return { x: [0, -5, 5, -3, 0], y: 0, rotate: 0, transition: { duration: 0.6, ease: 'easeInOut' as const } };
    case 'surprised': return { y: [0, -7, 0], x: 0, rotate: 0, transition: { duration: 0.35 } };
    case 'point': return { x: [0, 4, 0], y: 0, rotate: 0, transition: { duration: 0.3 } };
    case 'explain': return { y: [0, -3, 0], x: 0, rotate: 0, transition: { duration: 0.4 } };
    case 'think': return { rotate: [0, -1.5], x: 0, y: 0, transition: { duration: 0.5 } };
    default: return { x: 0, y: 0, rotate: 0, transition: { duration: 0.2 } };
  }
}

export function Character(props: CharacterRigProps & { gesture?: Pose | null }) {
  const sheet = available[props.role];
  if (!sheet) return <CharacterRig {...props} />;
  const pose = resolve(poseFor(props.state, props.mouth, props.gesture ?? null), sheet.poses);
  const motionKey = pose === 'talk' || pose === 'idle' ? 'rest' : pose; // mouth flicker must not retrigger motion
  return (
    <div className={`relative ${props.className ?? ''}`} role="img" aria-label={props.title ?? `${props.role} (${props.state})`} style={{ aspectRatio: `${sheet.width} / ${sheet.height}` }}>
      <motion.div key={motionKey} className="absolute inset-0" initial={false} animate={motionFor(pose)} style={{ transformOrigin: '50% 95%' }}>
        {sheet.poses.map((p) => (
          // All frames stay mounted so swaps are instant (no decode flicker mid-speech).
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p} src={`/characters/${props.role}/${p}.webp`} alt="" draggable={false}
            className="absolute inset-0 h-full w-full object-contain [image-rendering:pixelated]"
            style={{ opacity: p === pose ? 1 : 0 }} />
        ))}
      </motion.div>
    </div>
  );
}
