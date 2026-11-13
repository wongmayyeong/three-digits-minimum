/**
 * Home hero: a clean title block and an abstract graphic of the four price rungs rising ($10 to $100), drawn as
 * glossy mint columns over a dot grid. Original art in the visual language of near.org (dark ground, mint, dot grid);
 * no NEAR marks. Motion is CSS only and stops under reduced motion.
 */
const RUNGS = [
  { price: 10, h: 0.3 },
  { price: 25, h: 0.48 },
  { price: 50, h: 0.7 },
  { price: 100, h: 1 },
];

function RungsGraphic() {
  const W = 520, H = 460, base = 400, colW = 74, gap = 34, x0 = 66, maxH = 300;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Four columns rising from $10 to $100: the price ladder">
      <defs>
        <linearGradient id="hx-col" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#00b874" />
          <stop offset="0.38" stopColor="#3ff8b6" />
          <stop offset="0.62" stopColor="#00ec97" />
          <stop offset="1" stopColor="#007a4d" />
        </linearGradient>
        <linearGradient id="hx-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hx-ghost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00ec97" stopOpacity="0.25" />
          <stop offset="1" stopColor="#00ec97" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hx-bloom" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#00ec97" stopOpacity="0.45" />
          <stop offset="1" stopColor="#00ec97" stopOpacity="0" />
        </radialGradient>
        <filter id="hx-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse cx={W * 0.62} cy={base - 120} rx="230" ry="200" fill="url(#hx-bloom)" />
      {/* Floor reflection line */}
      <line x1="30" x2={W - 30} y1={base + 0.5} y2={base + 0.5} stroke="#00ec97" strokeOpacity="0.25" />
      {RUNGS.map((r, i) => {
        const x = x0 + i * (colW + gap);
        const h = r.h * maxH;
        const y = base - h;
        return (
          <g key={r.price}>
            {/* Glow behind */}
            <rect x={x + 8} y={y + 10} width={colW - 16} height={h - 10} rx="18" fill="#00ec97" opacity="0.35" filter="url(#hx-glow)" />
            <g className="nb-rise" style={{ ['--delay' as string]: `${0.15 + i * 0.14}s` }}>
              <rect x={x} y={y} width={colW} height={h} rx={colW / 2.6} fill="url(#hx-col)" />
              <rect x={x + 6} y={y + 4} width={colW - 12} height={Math.min(90, h)} rx={colW / 3} fill="url(#hx-fade)" />
              <rect x={x + colW * 0.22} y={y + 14} width="6" height={h - 40} rx="3" fill="#fff" opacity="0.28" />
            </g>
            {/* Reflection */}
            <rect x={x} y={base + 6} width={colW} height={Math.min(70, h * 0.4)} rx={colW / 2.6} fill="url(#hx-ghost)" opacity="0.6" />
            <text x={x + colW / 2} y={y - 16} textAnchor="middle" className="num" fontSize="20" fill="#f4f3ec">${r.price}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function HeroIntro({ title, subtitle, asOf }: { title: string; subtitle: string; asOf: string | null }) {
  return (
    <section aria-label="Thesis" className="relative overflow-hidden border-b hairline">
      <div aria-hidden="true" className="nb-hero-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid min-h-[min(86dvh,780px)] max-w-[1320px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-20">
        <div>
          <p className="eyebrow mb-6 text-mint">An evidence-based NEAR investment thesis</p>
          <h1 className="display-xl text-balance [font-size:clamp(3rem,7vw,6rem)]">{title}</h1>
          <p className="mt-6 max-w-xl text-xl leading-snug text-fg-2 md:text-2xl">{subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#answer" className="btn btn-primary h-12 px-6 text-base">Read the verdict</a>
            <a href="#ladder" className="btn btn-ghost h-12 px-6 text-base">Explore the ladder</a>
          </div>
          {asOf && <p className="mt-8 text-xs text-muted">Data through {asOf} · Not financial advice · Not affiliated with the NEAR Foundation</p>}
        </div>
        <div className="nb-float mx-auto w-full max-w-[560px]" aria-hidden="false">
          <RungsGraphic />
        </div>
      </div>
    </section>
  );
}
