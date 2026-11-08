import Link from 'next/link';

/** Concave four-point star (the evidence spark). */
export function starPath(cx: number, cy: number, r: number, pinch = 0.18): string {
  const p = r * pinch;
  return `M${cx} ${cy - r} C${cx + p} ${cy - p} ${cx + p} ${cy - p} ${cx + r} ${cy} C${cx + p} ${cy + p} ${cx + p} ${cy + p} ${cx} ${cy + r} C${cx - p} ${cy + p} ${cx - p} ${cy + p} ${cx - r} ${cy} C${cx - p} ${cy - p} ${cx - p} ${cy - p} ${cx} ${cy - r}Z`;
}

/** Logo mark: Bull and Bear facing off (generated art, see design/prompts.md). */
export function Emblem({ size = 28, className = '' }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" width={Math.round(size * 1.97)} height={size} alt="" aria-hidden="true" className={`object-contain ${className}`} />;
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Emblem size={30} />
      <span className="text-[0.9375rem] font-[600] tracking-[-0.01em]">Building or Hype?</span>
    </span>
  );
}

const NAV = [
  { href: '/', label: 'Thesis' },
  { href: '/research', label: 'Data & Queries' },
  { href: '/methodology', label: 'Methodology' },
];

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b hairline bg-[color-mix(in_srgb,var(--color-bg)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Is NEAR Building the Future or Following the Hype? Home" className="shrink-0 rounded-sm">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="-mr-2 flex items-center overflow-x-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-sm px-2.5 py-2 text-sm text-fg-2 transition-colors hover:text-fg sm:px-3">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t hairline">
      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-sm leading-relaxed">An independent, reproducible investment thesis on NEAR, built for the NEAR HACKATHON 2026 Investment Thesis track. Not affiliated with or endorsed by the NEAR Foundation.</p>
        </div>
        <div className="space-y-2">
          <p className="eyebrow">Research</p>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-fg" href="/">The thesis and verdict</Link></li>
            <li><Link className="hover:text-fg" href="/#episodes">Debate episodes</Link></li>
            <li><Link className="hover:text-fg" href="/research">Data and queries</Link></li>
            <li><Link className="hover:text-fg" href="/methodology">Methodology and model</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="eyebrow">Disclosure</p>
          <p className="leading-relaxed">Educational research, not financial advice. Arguments, voices and scores are AI-generated from a frozen evidence snapshot and audited by deterministic checks. Nothing here predicts prices.</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Sparse field of breathing four-point stars. Positions are deterministic (seeded) so server
 * and client render identically; motion is CSS opacity only, disabled under reduced motion.
 */
function seededStars(count: number, seed: number) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, () => {
    const big = rand() > 0.86;
    return { x: rand() * 100, y: rand() * 100, r: big ? 0.9 + rand() * 0.8 : 0.28 + rand() * 0.4, d: 6 + rand() * 7, delay: -rand() * 10, hi: big ? 0.7 : 0.45 };
  });
}

export function StarField({ count = 26, seed = 7, className = '' }: { count?: number; seed?: number; className?: string }) {
  const stars = seededStars(count, seed);
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {stars.map((st, i) => (
        <path
          key={i}
          className="nb-star"
          d={starPath(st.x, st.y, st.r, 0.16)}
          fill="var(--color-mint)"
          style={{ ['--d' as string]: `${st.d}s`, ['--delay' as string]: `${st.delay}s`, ['--o-hi' as string]: st.hi, ['--o-lo' as string]: 0.08 } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const tone: Record<string, string> = {
    OBSERVED: 'border-[rgb(0_236_151/0.45)] text-mint',
    DERIVED: 'border-line-strong text-fg-2',
    REPORTED: 'border-[rgb(245_196_81/0.45)] text-amber',
    ASSUMED: 'border-[rgb(255_121_102/0.45)] text-coral',
  };
  return <span className={`chip ${tone[type] ?? ''}`} title={TYPE_HELP[type]}>{type}</span>;
}

export const TYPE_HELP: Record<string, string> = {
  OBSERVED: 'Read directly from a source API or the chain.',
  DERIVED: 'Computed here from observed values; the formula is listed.',
  REPORTED: 'Stated by a third party; not independently verified.',
  ASSUMED: 'A scenario input chosen for analysis. Not evidence.',
};
