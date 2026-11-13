/**
 * Home hero: a clean title block and an isometric glass staircase of the four price rungs ($10 to $100), with a
 * light that climbs the steps, a glowing orb with orbit rings over the $100 step, a fading floor grid and rising
 * particles. Original art in the visual language of near.org (dark ground, NEAR green, dot grid); the orb carries
 * the NEAR "N" mark (NEAR is a trademark of its owners; this project is independent).
 * SVG and CSS only; all motion stops under reduced motion.
 */

const STEPS = [
  { price: 10, h: 54 },
  { price: 25, h: 104 },
  { price: 50, h: 166 },
  { price: 100, h: 246 },
];
const OX = 214, OY = 470, S = 84; // iso origin, step footprint
/** Visible canvas, cropped to the art (steps, tags, orb and halo); the floor grid and glow bleed past it. */
const VIEW = '92 64 526 520';
const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
/** Isometric projection: x to the lower right, y to the lower left, z up. */
const P = (x: number, y: number, z: number): [number, number] => [OX + (x - y) * C30, OY + (x + y) * S30 - z];
/** The NEAR "N" mark, drawn in a 90 x 90 box. */
const NEAR_N = 'M72.2 4.6L53.4 32.5c-1.3 1.9 1.2 4.2 3 2.6L74.9 19c.5-.4 1.2-.1 1.2.6v50.3c0 .7-.9 1-1.3.5l-56-67C17 1.2 14.4 0 11.5 0h-2C4.3 0 0 4.3 0 9.6v70.8C0 85.7 4.3 90 9.6 90c3.3 0 6.4-1.7 8.2-4.6l18.8-27.9c1.3-1.9-1.2-4.2-3-2.6l-18.5 16c-.5.4-1.2.1-1.2-.6V20.1c0-.7.9-1 1.3-.5l56 67c1.8 2.2 4.5 3.4 7.3 3.4h2c5.3 0 9.6-4.3 9.6-9.6V9.6c0-5.3-4.3-9.6-9.6-9.6-3.4 0-6.5 1.7-8.3 4.6z';
const pts = (...p: [number, number][]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

// Deterministic particles (server and client render identically).
const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return { x: 140 + r(1) * 420, y: 180 + r(2) * 360, s: 0.8 + r(3) * 1.8, d: 6 + r(4) * 8, delay: -r(5) * 12, o: 0.35 + r(6) * 0.5 };
});

function Staircase() {
  // Steps run up and to the right: each one sits one footprint further back along -y.
  const steps = STEPS.map((st, i) => {
    const x0 = i * S * 0.62, y0 = -i * S * 0.62, x1 = x0 + S, y1 = y0 + S, h = st.h;
    const top = pts(P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h));
    const right = pts(P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, h), P(x1, y0, h)); // faces +x (lower right)
    const left = pts(P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, h), P(x0, y1, h)); // faces +y (lower left)
    const labelAt = P(x0 + S * 0.5, y0 + S * 0.5, h);
    return { ...st, i, top, right, left, labelAt, edgeTop: P(x1, y1, h), edgeBot: P(x1, y1, 0) };
  });
  const last = steps[3]!;
  const orb: [number, number] = [last.labelAt[0], last.labelAt[1] - 100];

  return (
    <svg viewBox={VIEW} className="h-auto w-full overflow-visible" role="img" aria-label="An isometric glass staircase rising from $10 to $100, with a glowing NEAR orb above the top step">
      <defs>
        <linearGradient id="hx-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b8ffe4" /><stop offset="0.45" stopColor="#3ff8b6" /><stop offset="1" stopColor="#00c27c" /></linearGradient>
        <linearGradient id="hx-left" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00d98a" stopOpacity="0.95" /><stop offset="1" stopColor="#023d29" stopOpacity="0.9" /></linearGradient>
        <linearGradient id="hx-right" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00895a" stopOpacity="0.95" /><stop offset="1" stopColor="#011f15" stopOpacity="0.92" /></linearGradient>
        <linearGradient id="hx-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id="hx-orb" cx="0.36" cy="0.32" r="0.7"><stop offset="0" stopColor="#ffffff" /><stop offset="0.18" stopColor="#c9ffe9" /><stop offset="0.5" stopColor="#00ec97" /><stop offset="1" stopColor="#003b27" /></radialGradient>
        <radialGradient id="hx-halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#00ec97" stopOpacity="0.55" /><stop offset="1" stopColor="#00ec97" stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-floorfade" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <mask id="hx-floormask"><ellipse cx={OX + 120} cy={OY + 10} rx="300" ry="150" fill="url(#hx-floorfade)" /></mask>
        <filter id="hx-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
        <filter id="hx-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* Ambient bloom */}
      <ellipse cx={orb[0] - 40} cy={OY - 150} rx="260" ry="220" fill="url(#hx-halo)" opacity="0.5" />

      {/* Isometric floor grid, fading out */}
      <g mask="url(#hx-floormask)" stroke="#00ec97" strokeOpacity="0.22" strokeWidth="1">
        {Array.from({ length: 13 }, (_, k) => { const t = (k - 4) * S * 0.62; const a = P(t, -320, 0), b = P(t, 260, 0); const c = P(-320, t, 0), d = P(420, t, 0); return <g key={k}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} /></g>; })}
      </g>

      {/* Glow under the staircase */}
      <g filter="url(#hx-blur)" opacity="0.55">{[...steps].reverse().map((s) => <polygon key={s.price} points={s.top} fill="#00ec97" />)}</g>

      {/* Steps, far to near */}
      {[...steps].reverse().map((s) => (
        <g key={s.price} className="nb-rise" style={{ ['--delay' as string]: `${0.6 + s.i * 0.14}s` }}>
          <polygon points={s.left} fill="url(#hx-left)" stroke="#9dffd8" strokeOpacity="0.35" strokeWidth="1" />
          <polygon points={s.right} fill="url(#hx-right)" stroke="#9dffd8" strokeOpacity="0.25" strokeWidth="1" />
          <polygon points={s.top} fill="url(#hx-top)" stroke="#e6fff5" strokeOpacity="0.7" strokeWidth="1" />
          {/* Climbing light: each top face flares in turn */}
          <polygon points={s.top} fill="#ffffff" className="nb-climb" style={{ ['--delay' as string]: `${s.i * 0.55}s` }} />
          {/* Front vertical edge highlight */}
          <line x1={s.edgeTop[0]} y1={s.edgeTop[1]} x2={s.edgeBot[0]} y2={s.edgeBot[1]} stroke="url(#hx-sheen)" strokeWidth="2" opacity="0.8" />
        </g>
      ))}

      {/* Price tags */}
      {steps.map((s) => (
        <g key={`t${s.price}`} transform={`translate(${s.labelAt[0] - 64} ${s.labelAt[1] - 22})`}>
          <rect x="-34" y="-15" width="68" height="28" rx="14" fill="#030504" fillOpacity="0.72" stroke="#00ec97" strokeOpacity={s.price === 100 ? 0.9 : 0.4} />
          <text x="0" y="5" textAnchor="middle" className="num" fontSize="15" fill={s.price === 100 ? '#00ec97' : '#f4f3ec'}>${s.price}</text>
        </g>
      ))}

      {/* Orb over three digits, with orbit rings and a satellite */}
      <g className="nb-float">
        <ellipse cx={orb[0]} cy={orb[1] + 4} rx="84" ry="84" fill="url(#hx-halo)" />
        <g style={{ transformOrigin: `${orb[0]}px ${orb[1]}px` }} className="nb-orbit">
          <ellipse cx={orb[0]} cy={orb[1]} rx="86" ry="24" fill="none" stroke="#00ec97" strokeOpacity="0.55" strokeDasharray="2 6" />
        </g>
        <ellipse cx={orb[0]} cy={orb[1]} rx="106" ry="32" fill="none" stroke="#9dffd8" strokeOpacity="0.25" transform={`rotate(-18 ${orb[0]} ${orb[1]})`} />
        <circle cx={orb[0]} cy={orb[1]} r="42" fill="url(#hx-orb)" />
        <circle cx={orb[0]} cy={orb[1]} r="42" fill="none" stroke="#e6fff5" strokeOpacity="0.5" strokeWidth="1" />
        {/* NEAR "N", slightly embossed */}
        <path d={NEAR_N} transform={`translate(${orb[0] - 17.5} ${orb[1] - 16.5}) scale(0.39)`} fill="#9dffd8" opacity="0.5" />
        <path d={NEAR_N} transform={`translate(${orb[0] - 18} ${orb[1] - 17.5}) scale(0.39)`} fill="#02140d" />
        <ellipse cx={orb[0] - 20} cy={orb[1] - 26} rx="11" ry="5" fill="#fff" opacity="0.5" filter="url(#hx-soft)" transform={`rotate(-30 ${orb[0] - 20} ${orb[1] - 26})`} />
        <circle r="4.5" fill="#e6fff5" className="nb-sat" style={{ offsetPath: `path('M ${orb[0] - 106} ${orb[1]} a 106 32 0 1 0 212 0 a 106 32 0 1 0 -212 0')` } as React.CSSProperties} />
      </g>

      {/* Rising particles */}
      {PARTICLES.map((p, k) => (
        <circle key={k} cx={p.x} cy={p.y} r={p.s} fill="#9dffd8" className="nb-particle" style={{ ['--d' as string]: `${p.d}s`, ['--delay' as string]: `${p.delay}s`, ['--o' as string]: p.o } as React.CSSProperties} />
      ))}
    </svg>
  );
}

export function HeroIntro({ title, subtitle, asOf }: { title: string; subtitle: string; asOf: string | null }) {
  return (
    <section aria-label="Thesis" className="relative overflow-hidden border-b hairline">
      <div aria-hidden="true" className="nb-hero-grid pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(0_236_151/0.16),transparent_62%)]" />
      <div className="relative mx-auto grid min-h-[min(86dvh,780px)] max-w-[1320px] items-center gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:py-20">
        <div>
          <p className="nb-in eyebrow mb-6 text-mint" style={{ ['--delay' as string]: '0.05s' }}>An evidence-based NEAR investment thesis</p>
          <h1 style={{ ['--delay' as string]: '0.15s' }} className="nb-in display-xl text-balance [font-size:clamp(3rem,7vw,6rem)]">{title}</h1>
          <p style={{ ['--delay' as string]: '0.32s' }} className="nb-in mt-6 max-w-xl text-xl leading-snug text-fg-2 md:text-2xl">{subtitle}</p>
          <div className="nb-in mt-10 flex flex-wrap gap-3" style={{ ['--delay' as string]: '0.48s' }}>
            <a href="#answer" className="btn btn-primary h-12 px-6 text-base">Read the verdict</a>
            <a href="#ladder" className="btn btn-ghost h-12 px-6 text-base">Explore the ladder</a>
          </div>
          {asOf && <p className="nb-in mt-8 text-xs text-muted" style={{ ['--delay' as string]: '0.62s' }}>Data through {asOf} · Not financial advice · Not affiliated with the NEAR Foundation</p>}
        </div>
        <div className="nb-in-art mx-auto w-full max-w-[560px] lg:max-w-[780px]" style={{ ['--delay' as string]: '0.2s' }}>
          <Staircase />
        </div>
      </div>
    </section>
  );
}
