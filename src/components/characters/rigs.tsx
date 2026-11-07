'use client';

/**
 * Bull, Bear and Judge: original layered SVG busts sharing one rig interface.
 * Independent parts (head, brows, eyes, pupils, mouth, horns/ears) are driven by
 * `state`, `mouth` and `lookAt`. Motion is spring-based and short; with reduced motion,
 * poses switch instantly and idle loops are off.
 */
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { memo } from 'react';

export type Role = 'bull' | 'bear' | 'judge';
export type VisualState = 'idle' | 'enter' | 'listening' | 'thinking' | 'speaking' | 'rebutting' | 'reacting' | 'judging' | 'verdict-winning' | 'verdict-losing';
export type MouthShape = 'closed' | 'small' | 'wide' | 'round' | 'smile' | 'frown';

export interface CharacterRigProps {
  role: Role;
  state: VisualState;
  mouth: MouthShape;
  /** -1 (look left) .. 1 (look right). */
  lookAt?: number;
  speakingIntensity?: number;
  className?: string;
  title?: string;
}

interface Pose {
  tilt: number;
  lift: number;
  browL: number;
  browR: number;
  browY: number;
  eyeY: number;
}

function poseFor(role: Role, state: VisualState): Pose {
  const base: Pose = { tilt: 0, lift: 0, browL: 0, browR: 0, browY: 0, eyeY: 0 };
  switch (state) {
    case 'speaking': return { ...base, tilt: role === 'bear' ? -2 : role === 'bull' ? 2 : 0, browY: -1.5 };
    case 'rebutting': return { ...base, tilt: role === 'bear' ? -4 : 4, browL: role === 'bull' ? 6 : -6, browR: role === 'bull' ? -6 : 6, browY: 1 };
    case 'listening': return { ...base, tilt: role === 'bull' ? 3 : role === 'bear' ? -3 : 0, browY: -0.5 };
    case 'thinking': return { ...base, tilt: role === 'bear' ? 2 : -2, eyeY: -2.5, browL: -4, browY: -1 };
    case 'reacting': return { ...base, tilt: role === 'bull' ? -2 : 2, browL: role === 'bear' ? -10 : 4, browR: role === 'bear' ? 4 : -10, browY: -2 };
    case 'judging': return { ...base, browY: 1.5, browL: 3, browR: -3 };
    case 'verdict-winning': return { ...base, lift: -4, tilt: role === 'bull' ? 3 : role === 'bear' ? -3 : 0, browY: -2.5 };
    case 'verdict-losing': return { ...base, lift: 4, tilt: role === 'bull' ? -3 : 3, browL: -5, browR: 5, browY: 1.5, eyeY: 1.5 };
    default: return base;
  }
}

const spring: Transition = { type: 'spring', stiffness: 170, damping: 18, mass: 0.7 };

/** Mouth geometry per shape, centred on (cx, cy). */
function mouthPath(shape: MouthShape, cx: number, cy: number, w = 11): { d: string; open: boolean } {
  switch (shape) {
    case 'small': return { d: ellipse(cx, cy, w * 0.55, 2.6), open: true };
    case 'wide': return { d: ellipse(cx, cy + 0.5, w * 0.78, 5), open: true };
    case 'round': return { d: ellipse(cx, cy + 0.5, w * 0.42, 4.4), open: true };
    case 'smile': return { d: `M${cx - w} ${cy - 1.5} Q${cx} ${cy + 6} ${cx + w} ${cy - 1.5}`, open: false };
    case 'frown': return { d: `M${cx - w} ${cy + 3} Q${cx} ${cy - 3.5} ${cx + w} ${cy + 3}`, open: false };
    default: return { d: `M${cx - w} ${cy} Q${cx} ${cy + 1.6} ${cx + w} ${cy}`, open: false };
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number) {
  return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
}

function Mouth({ shape, cx, cy, w }: { shape: MouthShape; cx: number; cy: number; w?: number }) {
  const m = mouthPath(shape, cx, cy, w);
  return m.open ? (
    <path d={m.d} fill="#050806" stroke="var(--color-fg)" strokeWidth={1.8} strokeLinejoin="round" />
  ) : (
    <path d={m.d} fill="none" stroke="var(--color-fg)" strokeWidth={2} strokeLinecap="round" />
  );
}

const INK = 'var(--color-fg)';
const FACE = '#121a16';
const FACE_2 = '#1a2620';

function Eyes({ lx, rx, y, look, eyeY, rEye, blink, narrow }: { lx: number; rx: number; y: number; look: number; eyeY: number; rEye: number; blink: string; narrow?: boolean }) {
  const reduce = useReducedMotion();
  const dx = look * (rEye * 0.42);
  return (
    <g className="nb-blink" style={{ ['--blink' as string]: blink } as React.CSSProperties}>
      {[lx, rx].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={rEye} ry={narrow ? rEye * 0.62 : rEye * 0.78} fill={INK} />
          <motion.circle cy={y} r={rEye * 0.46} fill="#060a08" initial={false} animate={{ cx: x + dx, cy: y + eyeY * 0.5 }} transition={reduce ? { duration: 0 } : spring} />
        </g>
      ))}
    </g>
  );
}

function Brows({ lx, rx, y, len, pose, weight = 2.4 }: { lx: number; rx: number; y: number; len: number; pose: Pose; weight?: number }) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : spring;
  return (
    <g stroke={INK} strokeWidth={weight} strokeLinecap="round">
      <motion.line x1={lx - len / 2} x2={lx + len / 2} y1={y} y2={y} initial={false} animate={{ rotate: pose.browL, y: pose.browY }} transition={t} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      <motion.line x1={rx - len / 2} x2={rx + len / 2} y1={y} y2={y} initial={false} animate={{ rotate: pose.browR, y: pose.browY }} transition={t} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
    </g>
  );
}

function Shoulders({ accent }: { accent: string }) {
  return (
    <g>
      <path d="M22 200 C26 172 50 158 76 154 L124 154 C150 158 174 172 178 200 Z" fill={FACE} stroke="var(--color-line-strong)" strokeWidth={1.5} />
      <path d="M84 154 L100 182 L116 154" fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

function BullArt({ pose, mouth, look, reduce }: { pose: Pose; mouth: MouthShape; look: number; reduce: boolean }) {
  return (
    <>
      <Shoulders accent="var(--color-mint)" />
      <rect x={86} y={136} width={28} height={22} fill={FACE_2} />
      <motion.g initial={false} animate={{ rotate: pose.tilt, y: pose.lift }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'view-box', transformOrigin: '100px 140px' }}>
        <path d="M63 72 C44 70 30 58 27 38 C38 50 52 56 68 62" fill="rgb(0 236 151 / 0.1)" stroke="var(--color-mint)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M137 72 C156 70 170 58 173 38 C162 50 148 56 132 62" fill="rgb(0 236 151 / 0.1)" stroke="var(--color-mint)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M58 86 C46 84 40 78 38 70 C48 72 54 74 60 78" fill={FACE} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M142 86 C154 84 160 78 162 70 C152 72 146 74 140 78" fill={FACE} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M60 70 Q100 54 140 70 L145 100 Q147 128 128 146 L72 146 Q53 128 55 100 Z" fill={FACE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <path d="M92 60 L100 70 L108 60" fill="none" stroke="var(--color-mint)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        <Brows lx={81} rx={119} y={84} len={18} pose={pose} weight={2.6} />
        <Eyes lx={81} rx={119} y={96} look={look} eyeY={pose.eyeY} rEye={5.4} blink="5.6s" />
        <rect x={76} y={110} width={48} height={32} rx={15} fill={FACE_2} stroke="var(--color-line-strong)" strokeWidth={1.5} />
        <ellipse cx={90} cy={120} rx={2.6} ry={3.4} fill="#060a08" />
        <ellipse cx={110} cy={120} rx={2.6} ry={3.4} fill="#060a08" />
        <Mouth shape={mouth} cx={100} cy={133} w={10} />
      </motion.g>
    </>
  );
}

function BearArt({ pose, mouth, look, reduce }: { pose: Pose; mouth: MouthShape; look: number; reduce: boolean }) {
  return (
    <>
      <Shoulders accent="var(--color-coral)" />
      <rect x={86} y={136} width={28} height={22} fill={FACE_2} />
      <motion.g initial={false} animate={{ rotate: pose.tilt, y: pose.lift }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'view-box', transformOrigin: '100px 140px' }}>
        <circle cx={66} cy={62} r={15} fill={FACE} stroke={INK} strokeWidth={2} />
        <circle cx={134} cy={62} r={15} fill={FACE} stroke={INK} strokeWidth={2} />
        <circle cx={66} cy={62} r={6.5} fill="none" stroke="var(--color-coral)" strokeWidth={2} />
        <circle cx={134} cy={62} r={6.5} fill="none" stroke="var(--color-coral)" strokeWidth={2} />
        <path d="M57 94 C57 66 77 52 100 52 C123 52 143 66 143 94 C143 126 124 147 100 147 C76 147 57 126 57 94 Z" fill={FACE} stroke={INK} strokeWidth={2} />
        <Brows lx={84} rx={116} y={84} len={16} pose={pose} weight={3} />
        <Eyes lx={84} rx={116} y={95} look={look} eyeY={pose.eyeY} rEye={4.6} blink="6.4s" narrow />
        <ellipse cx={100} cy={123} rx={23} ry={17} fill={FACE_2} stroke="var(--color-line-strong)" strokeWidth={1.5} />
        <path d="M93 110 Q100 106 107 110 Q104 117 100 118 Q96 117 93 110 Z" fill={INK} />
        <path d="M100 118 L100 124" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <Mouth shape={mouth} cx={100} cy={131} w={9} />
      </motion.g>
    </>
  );
}

function JudgeArt({ pose, mouth, look, reduce }: { pose: Pose; mouth: MouthShape; look: number; reduce: boolean }) {
  const open = mouth === 'wide' ? 4 : mouth === 'round' ? 3.2 : mouth === 'small' ? 2 : 0;
  return (
    <>
      <path d="M22 200 C26 172 50 158 76 154 L124 154 C150 158 174 172 178 200 Z" fill="#0e1512" stroke="var(--color-line-strong)" strokeWidth={1.5} />
      <path d="M86 154 L100 170 L114 154 M100 170 L100 200" fill="none" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M92 182 L100 176 L108 182" fill="none" stroke="var(--color-mint)" strokeWidth={1.6} strokeLinecap="round" />
      <rect x={88} y={138} width={24} height={20} fill={FACE_2} />
      <motion.g initial={false} animate={{ rotate: pose.tilt, y: pose.lift }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'view-box', transformOrigin: '100px 142px' }}>
        <path d="M64 62 L56 36 L82 52" fill={FACE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <path d="M136 62 L144 36 L118 52" fill={FACE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <path d="M56 86 C56 60 76 47 100 47 C124 47 144 60 144 86 L144 116 C144 138 124 151 100 151 C76 151 56 138 56 116 Z" fill={FACE} stroke={INK} strokeWidth={2} />
        <circle cx={80} cy={95} r={19} fill={FACE_2} stroke="var(--color-line-strong)" strokeWidth={1.5} />
        <circle cx={120} cy={95} r={19} fill={FACE_2} stroke="var(--color-line-strong)" strokeWidth={1.5} />
        <Brows lx={80} rx={120} y={70} len={20} pose={pose} weight={2.4} />
        <circle cx={80} cy={95} r={9.5} fill="none" stroke="var(--color-mint)" strokeWidth={1.4} opacity={0.9} />
        <circle cx={120} cy={95} r={9.5} fill="none" stroke="var(--color-mint)" strokeWidth={1.4} opacity={0.9} />
        <Eyes lx={80} rx={120} y={95} look={look} eyeY={pose.eyeY} rEye={6.6} blink="7.2s" />
        <path d={`M93 111 L100 106 L107 111 L100 ${121 - open * 0.3} Z`} fill={INK} />
        <motion.path d="M95 121 L100 125 L105 121" fill="none" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" initial={false} animate={{ y: open }} transition={{ duration: 0.06 }} />
      </motion.g>
    </>
  );
}

export const CharacterRig = memo(function CharacterRig({ role, state, mouth, lookAt = 0, className = '', title }: CharacterRigProps) {
  const reduce = !!useReducedMotion();
  const pose = poseFor(role, state);
  const Art = role === 'bull' ? BullArt : role === 'bear' ? BearArt : JudgeArt;
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ?? `${role} (${state})`}>
      <Art pose={pose} mouth={mouth} look={lookAt} reduce={reduce} />
    </svg>
  );
});
