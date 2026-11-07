import Link from 'next/link';
import { formatDate, formatValue } from '@/lib/format';

export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1320px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionHead({ eyebrow, title, children, id }: { eyebrow?: string; title: string; children?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end" id={id}>
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="display-m text-balance">{title}</h2>
      </div>
      {children && <div className="max-w-xl text-[0.9375rem] leading-relaxed text-fg-2 md:justify-self-end">{children}</div>}
    </div>
  );
}

export function StatValue({ value, unit, className = '' }: { value: number | null; unit: string; className?: string }) {
  return <span className={`num ${value === null ? 'text-muted' : ''} ${className}`}>{formatValue(value, unit)}</span>;
}

export function AsOf({ date, prefix = 'as of' }: { date: string | null | undefined; prefix?: string }) {
  if (!date) return <span className="text-muted">date unknown</span>;
  return <time dateTime={date} className="text-muted">{prefix} {formatDate(date)}</time>;
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="panel flex flex-col items-start gap-3 p-6 sm:p-8">
      <p className="text-base font-[560]">{title}</p>
      {children && <div className="max-w-prose text-sm leading-relaxed text-muted">{children}</div>}
      {action && <Link href={action.href} className="btn btn-ghost mt-1">{action.label}</Link>}
    </div>
  );
}

export function Notice({ tone = 'neutral', title, children }: { tone?: 'neutral' | 'warn' | 'error' | 'ok'; title: string; children?: React.ReactNode }) {
  const bar = { neutral: 'bg-line-strong', warn: 'bg-amber', error: 'bg-coral', ok: 'bg-mint' }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className="panel relative overflow-hidden py-3 pl-5 pr-4 text-sm">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${bar}`} aria-hidden="true" />
      <p className="font-[560] text-fg">{title}</p>
      {children && <div className="mt-1 leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function ExternalLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const internal = href.startsWith('/');
  if (internal) return <Link href={href} className={`link ${className}`}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`link ${className}`}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className="ml-1 inline-block align-baseline opacity-60"><path d="M3 1h6v6M9 1 1 9" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
    </a>
  );
}

export function WinnerLabel({ winner }: { winner: string | null }) {
  if (!winner) return <span className="text-muted">No verdict</span>;
  const map: Record<string, { label: string; cls: string }> = {
    bull: { label: 'Bull wins', cls: 'text-mint' },
    bear: { label: 'Bear wins', cls: 'text-coral' },
    inconclusive: { label: 'Inconclusive', cls: 'text-fg-2' },
  };
  const m = map[winner] ?? { label: winner, cls: '' };
  return <span className={`font-[560] ${m.cls}`}>{m.label}</span>;
}
