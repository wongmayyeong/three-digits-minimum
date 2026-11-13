'use client';

/**
 * "On this page" navigation. In place at the top of the page; once it scrolls out of view, the same links appear
 * as a bar fixed to the bottom of the screen, highlighting the section being read (scroll-spy) and keeping the
 * active link visible.
 */
import { useEffect, useRef, useState } from 'react';

export function SectionNav({ items }: { items: [string, string][] }) {
  const inFlow = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  const [active, setActive] = useState<string>(items[0]?.[0] ?? '');

  // Show the bottom bar once the in-flow nav has scrolled above the viewport.
  useEffect(() => {
    const el = inFlow.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e!.isIntersecting && e!.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll-spy: the section crossing the upper part of the viewport is active.
  useEffect(() => {
    const sections = items.map(([h]) => document.querySelector<HTMLElement>(h)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(`#${visible[0].target.id}`);
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  // Keep the active link in view inside the bar.
  useEffect(() => {
    if (!showBar) return;
    const link = bar.current?.querySelector<HTMLElement>(`a[href="${active}"]`);
    link?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active, showBar]);

  const chip = (h: string, l: string, compact = false) => (
    <a key={h} href={h} aria-current={active === h ? 'location' : undefined}
      className={`chip shrink-0 transition-colors ${compact ? 'h-8 px-3' : 'h-8 px-3'} ${active === h ? 'border-mint bg-mint/10 text-mint' : 'hover:text-fg'}`}>
      {l}
    </a>
  );

  return (
    <>
      <nav ref={inFlow} aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm">
        {items.map(([h, l]) => chip(h, l))}
      </nav>
      <div aria-hidden={!showBar} className={`no-print fixed inset-x-0 bottom-4 z-30 flex justify-center px-3 transition-all duration-300 ${showBar ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}>
        <nav aria-label="Section progress" className="max-w-full rounded-full border border-line-strong bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] p-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.5)] backdrop-blur-md">
          <div ref={bar} className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]" tabIndex={showBar ? undefined : -1}>
            {items.map(([h, l]) => chip(h, l, true))}
          </div>
        </nav>
      </div>
    </>
  );
}
