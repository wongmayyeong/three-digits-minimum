'use client';

/** Primary navigation with the current page highlighted (mint label and underline, aria-current). */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Thesis' },
  { href: '/research', label: 'Data & Queries' },
  { href: '/methodology', label: 'Methodology' },
];

export function NavLinks() {
  const path = usePathname() ?? '/';
  const isActive = (href: string) => (href === '/' ? path === '/' || path.startsWith('/debates') : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Primary" className="-mr-2 flex items-center overflow-x-auto">
      {NAV.map((n) => {
        const active = isActive(n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
            className={`relative whitespace-nowrap rounded-sm px-2.5 py-2 text-sm transition-colors sm:px-3 ${active ? 'text-mint' : 'text-fg-2 hover:text-fg'}`}>
            {n.label}
            <span aria-hidden="true" className={`absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-mint shadow-[0_0_12px_rgb(0_236_151/0.7)] transition-opacity sm:inset-x-3 ${active ? 'opacity-100' : 'opacity-0'}`} />
          </Link>
        );
      })}
    </nav>
  );
}
