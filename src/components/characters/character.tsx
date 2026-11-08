'use client';

/**
 * Character renderer. Uses generated pixel-art pose frames from public/characters/<role>/
 * when `sprites.json` lists the role (written by scripts/slice-sprites.ts); otherwise falls back
 * to the vector rig. Pose follows the debate state; the talk frame alternates with the idle frame
 * from the same playback-driven mouth signal the vector rig uses, so speech stays in sync and
 * stops the moment playback pauses. Gestures (nod, shake, pop) play once per state change.
 */
import { motion } from 'motion/react';
import { CharacterRig, type CharacterRigProps, type MouthShape, type VisualState } from './rigs';
import manifest from './sprites.json';

type Pose = 'idle' | 'talk' | 'think' | 'surprised' | 'agree' | 'disagree';

const available = manifest as Record<string, { width: number; height: number; poses: string[] } | undefined>;

export function poseFor(state: VisualState, mouth: MouthShape): Pose {
  const open = mouth === 'small' || mouth === 'wide' || mouth === 'round';
  switch (state) {
    case 'speaking':
    case 'judging':
      return open ? 'talk' : 'idle';
    case 'rebutting':
      return open ? 'talk' : 'disagree';
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

/** One-shot gesture per pose change; motion is skipped automatically under reduced motion. */
function gesture(pose: Pose) {
  switch (pose) {
    case 'agree': return { y: [0, 6, 0, 6, 0], transition: { duration: 0.9, ease: 'easeInOut' as const } };
    case 'disagree': return { x: [0, -6, 6, -4, 0], transition: { duration: 0.6, ease: 'easeInOut' as const } };
    case 'surprised': return { scale: [1, 1.06, 1], y: [0, -6, 0], transition: { duration: 0.35 } };
    case 'think': return { rotate: [0, -2, -2], transition: { duration: 0.5 } };
    default: return { x: 0, y: 0, scale: 1, rotate: 0, transition: { duration: 0.2 } };
  }
}

export function Character(props: CharacterRigProps) {
  const sheet = available[props.role];
  if (!sheet) return <CharacterRig {...props} />;
  const pose = poseFor(props.state, props.mouth);
  const gestureKey = pose === 'talk' ? 'idle' : pose; // talking flicker must not retrigger gestures
  return (
    <div className={`relative ${props.className ?? ''}`} role="img" aria-label={props.title ?? `${props.role} (${props.state})`} style={{ aspectRatio: `${sheet.width} / ${sheet.height}` }}>
      <motion.div key={gestureKey} className="absolute inset-0" initial={false} animate={gesture(pose)} style={{ transformOrigin: '50% 90%' }}>
        {(['idle', 'talk', 'think', 'surprised', 'agree', 'disagree'] as Pose[]).map((p) => (
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
