'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type MouthShape, type Role, type VisualState } from '@/components/characters/rigs';
import { Character, type Pose } from '@/components/characters/character';

export interface StageCast {
  active: Role | null;
  states: Record<Role, VisualState>;
  mouths: Record<Role, MouthShape>;
  look: Record<Role, number>;
  gestures?: Partial<Record<Role, Pose | null>>;
}

const NAMES: Record<Role, string> = { bull: 'Bull', bear: 'Bear', judge: 'Judge' };

/** Studio image size; every coordinate below is in these pixels. */
const W = 1672;
const H = 941;

/**
 * Where each character stands. `x` is the centre, `cut` the line inside the podium's top slab
 * where the bust is clipped (hidden by the foreground slab), `w` the rendered width.
 */
const SPOT: Record<Role, { x: number; cut: number; w: number }> = {
  bull: { x: 295, cut: 551, w: 330 },
  judge: { x: 837, cut: 533, w: 330 },
  bear: { x: 1377, cut: 551, w: 330 },
};

/** Camera framing per speaker when zoomed (scale and the point to centre). */
const CAMERA_CENTERED: Record<Role, { x: number }> = { bull: { x: 295 }, bear: { x: 1377 }, judge: { x: 837 } };
const CAMERA: Record<Role | 'wide', { scale: number; x: number; y: number }> = {
  wide: { scale: 1, x: W / 2, y: H / 2 },
  bull: { scale: 1.75, x: 465, y: 475 },
  bear: { scale: 1.75, x: 1207, y: 475 },
  judge: { scale: 1.45, x: 960, y: 432 },
};

const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [W - x, y] as [number, number]);
/** Foreground shapes traced from the studio image: podiums, the judge's desk and the mics. */
const LEFT_PODIUM: [number, number][] = [[122, 551], [203, 537], [469, 537], [469, 566], [457, 566], [457, 596], [436, 596], [436, 778], [449, 778], [449, 832], [139, 832], [139, 778], [153, 778], [153, 596], [136, 596], [136, 566], [122, 566]];
const LEFT_MIC: [number, number][] = [[221, 475], [225, 473], [232, 474], [245, 482], [245, 487], [270, 502], [275, 512], [275, 531], [280, 531], [281, 538], [256, 538], [257, 531], [269, 531], [269, 510], [267, 507], [242, 491], [236, 496], [231, 497], [221, 491]];
const DESK: [number, number][] = [[522, 514], [1154, 514], [1154, 552], [1142, 552], [1142, 712], [1176, 712], [1176, 792], [496, 792], [496, 712], [531, 712], [531, 552], [522, 552]];
const DESK_MIC: [number, number][] = [[842, 462], [854, 452], [865, 452], [869, 456], [868, 470], [860, 476], [850, 476], [847, 474], [835, 486], [834, 507], [842, 507], [847, 514], [847, 518], [811, 518], [812, 512], [817, 507], [825, 507], [826, 484], [842, 470]];
const FOREGROUND = [LEFT_PODIUM, mirror(LEFT_PODIUM), LEFT_MIC, mirror(LEFT_MIC), DESK, DESK_MIC];
const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');

const GLOW: Record<Role, string> = { bull: 'rgb(0 236 151 / 0.24)', judge: 'rgb(242 241 233 / 0.16)', bear: 'rgb(255 121 102 / 0.24)' };

/** NEAR symbol (from near.org), used as the studio's centre-pillar mark. */
function NearSymbol({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-label="NEAR" role="img">
      <path fill="currentColor" d="M13.9017 0.646973C13.3462 0.646973 12.8304 0.929357 12.5394 1.39357L9.40403 5.95741C9.30186 6.10784 9.34331 6.31059 9.49675 6.41075C9.6211 6.49202 9.78561 6.48196 9.89889 6.38645L12.9851 3.76201C13.0364 3.71677 13.1154 3.72137 13.1616 3.77165C13.1825 3.79469 13.1937 3.82444 13.1937 3.85502V12.0719C13.1937 12.1397 13.1377 12.1942 13.0684 12.1942C13.0312 12.1942 12.9962 12.1783 12.9727 12.1502L3.6435 1.20169C3.33966 0.850174 2.89352 0.647392 2.42388 0.646973H2.09782C1.21536 0.646973 0.5 1.34833 0.5 2.2135V13.7863C0.5 14.6515 1.21536 15.3528 2.09782 15.3528C2.65336 15.3528 3.16915 15.0704 3.46017 14.6062L6.59558 10.0424C6.69769 9.89194 6.65624 9.68919 6.50279 9.58903C6.37845 9.50776 6.21394 9.51782 6.10071 9.61334L3.01446 12.2378C2.96318 12.283 2.88412 12.2784 2.83797 12.2281C2.81703 12.2051 2.80592 12.1753 2.80634 12.1447V3.92583C2.80634 3.85796 2.86232 3.80349 2.93155 3.80349C2.96831 3.80349 3.00377 3.81941 3.02728 3.84748L12.3552 14.7981C12.659 15.1496 13.1052 15.3524 13.5749 15.3528H13.9009C14.7833 15.3532 15.4992 14.6523 15.5 13.7871V2.2135C15.5 1.34833 14.7842 0.646973 13.9017 0.646973Z" />
    </svg>
  );
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * The studio with the three characters, shared by the theatre, the fullscreen show and the hero.
 * Layers: studio image, characters (clipped inside the podium slab), the podiums redrawn from the
 * same image in front, then labels. With `zoom`, the camera frames the active speaker.
 */
export function StudioScene({ cast, judgeScene = false, zoom = false, centered = false, children }: { cast: StageCast; judgeScene?: boolean; zoom?: boolean; centered?: boolean; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const order: Role[] = ['bull', 'judge', 'bear'];
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 150, damping: 20 };
  const framed = CAMERA[zoom && cast.active ? cast.active : 'wide'];
  // Centered framing (phones, no side panel) keeps the speaker in the middle of the frame.
  const cam = zoom && cast.active && centered ? { ...framed, x: CAMERA_CENTERED[cast.active].x } : framed;
  const camTransition = reduce ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const };
  return (
    <div className="relative aspect-[1672/941] w-full overflow-hidden bg-[#060a08] [container-type:inline-size]">
      <motion.div className="absolute inset-0" initial={false}
        animate={{ scale: cam.scale, x: `${((W / 2 - cam.x) / W) * 100 * cam.scale}%`, y: `${((H / 2 - cam.y) / H) * 100 * cam.scale}%` }}
        transition={camTransition} style={{ transformOrigin: '50% 50%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stage/studio.webp" alt="" className="absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]" draggable={false} />
        <div className="absolute flex items-center justify-center text-mint" style={{ left: pct(838 - 90, W), top: pct(207 - 90, H), width: pct(180, W), height: pct(180, H) }}>
          <span className="absolute inset-[2%] rounded-full bg-[radial-gradient(circle,rgb(0_236_151/0.22),rgb(6_20_15/0.9)_70%)]" aria-hidden="true" />
          <NearSymbol className="relative h-[46%] w-[46%] drop-shadow-[0_0_8px_rgb(0_236_151/0.85)]" />
        </div>
        <motion.div aria-hidden="true" className="absolute inset-0 bg-[#060a08]" initial={false} animate={{ opacity: judgeScene ? 0.36 : 0.06 }} transition={{ duration: reduce ? 0 : 0.6 }} />

        {order.map((r) => {
          const s = SPOT[r];
          const isActive = cast.active === r;
          const dim = cast.active !== null && !isActive;
          return (
            <div key={r} className="absolute" style={{ left: pct(s.x - s.w / 2, W), width: pct(s.w, W), top: 0, height: pct(s.cut, H) }}>
              <motion.div aria-hidden="true" className="pointer-events-none absolute -inset-x-[30%] bottom-0 h-[70%]"
                style={{ background: `radial-gradient(ellipse at 50% 85%, ${GLOW[r]}, transparent 65%)` }}
                initial={false} animate={{ opacity: isActive ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.4 }} />
              <div className="absolute inset-0 overflow-hidden">
                <motion.div className="absolute inset-x-0 bottom-[-14%]" initial={false}
                  animate={{ scale: isActive && !zoom ? 1.05 : 1, filter: dim ? `brightness(${judgeScene ? 0.5 : 0.62}) saturate(0.7)` : 'brightness(1) saturate(1)' }}
                  transition={spring} style={{ transformOrigin: '50% 100%' }}>
                  <Character role={r} state={cast.states[r]} mouth={cast.mouths[r]} lookAt={cast.look[r]} gesture={cast.gestures?.[r] ?? null} className="w-full" title={`${NAMES[r]}, ${cast.states[r]}`} />
                </motion.div>
              </div>
            </div>
          );
        })}

        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <clipPath id="nb-foreground">{FOREGROUND.map((p, i) => <polygon key={i} points={poly(p)} />)}</clipPath>
          </defs>
          <image href="/stage/studio.webp" x="0" y="0" width={W} height={H} clipPath="url(#nb-foreground)" style={{ imageRendering: 'pixelated' }} />
          <motion.rect x="0" y="0" width={W} height={H} fill="#060a08" clipPath="url(#nb-foreground)" initial={false} animate={{ opacity: judgeScene ? 0.36 : 0.06 }} transition={{ duration: reduce ? 0 : 0.6 }} />
        </svg>

        <PodiumSign x={295} y={652} title="Reachable" caption="Three digits" color="#00ec97" dir="up" active={cast.active === 'bull'} />
        <PodiumSign x={1377} y={652} title="No minimum" caption="Three digits" color="#ff7966" dir="down" active={cast.active === 'bear'} />
        <JudgePlaque x={837} y={637} active={cast.active === 'judge'} />
      </motion.div>
      {children}
    </div>
  );
}

/** Image pixels to container units, so signs scale with the scene and zoom with the camera. */
const u = (n: number) => `${((n * 100) / W).toFixed(3)}cqw`;
const chamfer = (c: string) => `polygon(${c} 0, calc(100% - ${c}) 0, 100% ${c}, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, ${c} 100%, 0 calc(100% - ${c}), 0 ${c})`;

/** Pixel arrow (7x7 grid): up for the Bull case (three digits reachable), down for the Bear case (no minimum). */
function PixelArrow({ dir, color }: { dir: 'up' | 'down'; color: string }) {
  return (
    <svg viewBox="0 0 7 7" style={{ width: u(17), height: u(17), transform: dir === 'down' ? 'rotate(180deg)' : undefined }} shapeRendering="crispEdges" aria-hidden="true">
      <path fill={color} d="M3 0h1v1h1v1h1v1h1v1H5v3H2V4H0V3h1V2h1V1h1z" />
    </svg>
  );
}

/** Lit sign on a side podium's front panel: the question over the case that side argues. */
function PodiumSign({ x, y, title, caption, color, dir, active }: { x: number; y: number; title: string; caption: string; color: string; dir: 'up' | 'down'; active: boolean }) {
  const reduce = useReducedMotion();
  const clip = chamfer(u(9));
  return (
    <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none" style={{ left: pct(x, W), top: pct(y, H), width: u(234), height: u(98) }}>
      <motion.div aria-hidden="true" className="absolute" style={{ inset: `-${u(22)}`, background: `radial-gradient(closest-side, ${color}66, transparent)` }}
        initial={false} animate={{ opacity: active ? (reduce ? 1 : [0.6, 1, 0.6]) : 0.28 }}
        transition={active && !reduce ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }} />
      <div aria-hidden="true" className="absolute inset-0 transition-opacity duration-300" style={{ clipPath: clip, background: `linear-gradient(180deg, ${color}, ${color}99)`, opacity: active ? 1 : 0.62 }} />
      <div className="absolute flex flex-col items-center justify-center overflow-hidden" style={{ inset: u(3), clipPath: clip, background: 'linear-gradient(180deg, #111b17 0%, #060a08 100%)', gap: u(5) }}>
        <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 3px)' }} />
        <span aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: u(2), background: `${color}55` }} />
        <span className="relative flex items-center font-mono font-[600] uppercase" style={{ fontSize: u(11), letterSpacing: '0.34em', color: `${color}c0`, gap: u(8) }}>
          <span aria-hidden="true" style={{ width: u(14), height: u(2), background: `${color}80` }} />
          {caption}
          <span aria-hidden="true" style={{ width: u(14), height: u(2), background: `${color}80` }} />
        </span>
        <span className="relative flex items-center transition-opacity duration-300" style={{ gap: u(10), opacity: active ? 1 : 0.82 }}>
          <PixelArrow dir={dir} color={color} />
          <span className="font-[700] uppercase leading-none" style={{ fontFamily: 'var(--font-pixel)', fontSize: u(Math.min(30, 200 / title.length)), letterSpacing: '0.04em', color, textShadow: `0 0 ${u(active ? 12 : 6)} ${color}, 0 ${u(3)} 0 #000` }}>{title}</span>
        </span>
      </div>
    </div>
  );
}

/** Engraved gold lettering for the plaque on the judge's desk. */
function JudgePlaque({ x, y, active }: { x: number; y: number; active: boolean }) {
  const gold = 'linear-gradient(180deg, #fff4c8 0%, #f3d27a 42%, #b8842a 58%, #f0c862 100%)';
  const diamond = <span aria-hidden="true" style={{ width: u(9), height: u(9), background: gold, transform: 'rotate(45deg)' }} />;
  return (
    <div className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center" style={{ left: pct(x, W), top: pct(y, H), gap: u(4) }}>
      <span className="font-mono font-[600] uppercase" style={{ fontSize: u(11), letterSpacing: '0.42em', color: '#d9b45a', opacity: 0.8 }}>The Bench</span>
      <span className="flex items-center" style={{ gap: u(16) }}>
        {diamond}
        <span className="font-[700] uppercase leading-none transition-[filter] duration-300"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: u(42), letterSpacing: '0.14em', paddingLeft: '0.14em', backgroundImage: gold, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            filter: `drop-shadow(0 ${u(3)} 0 #000) drop-shadow(0 0 ${u(active ? 10 : 4)} rgb(243 210 122 / ${active ? 0.7 : 0.3}))` }}>Judge</span>
        {diamond}
      </span>
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
