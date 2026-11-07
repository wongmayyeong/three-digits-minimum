import type { Metadata } from 'next';
import Link from 'next/link';
import { LibraryRow } from '@/components/library-row';
import { Container, EmptyState, Notice } from '@/components/ui';
import { listLibrary } from '@/lib/debate/view';
import { TOPICS } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Replay library', description: 'Public NEBUBE debates with their verdicts and frozen evidence snapshots.' };

const valid = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const topic = TOPICS.some((t) => t.slug === sp.topic) ? sp.topic : undefined;
  const winner = ['bull', 'bear', 'inconclusive'].includes(sp.winner ?? '') ? sp.winner : undefined;
  const from = valid(sp.from);
  const to = valid(sp.to);
  const cursor = sp.cursor && /^d_[A-Za-z0-9_-]{8,20}$/.test(sp.cursor) ? sp.cursor : undefined;
  const result = await listLibrary({ topic, winner, from: from ? new Date(`${from}T00:00:00Z`) : undefined, to: to ? new Date(`${to}T23:59:59Z`) : undefined, cursor, limit: 20 }).catch(() => null);
  const filtered = !!(topic || winner || from || to);
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ topic, winner, from, to, ...extra })) if (v) p.set(k, v);
    return `/library?${p.toString()}`;
  };

  return (
    <Container className="py-12 md:py-16">
      <p className="eyebrow mb-3">Replay library</p>
      <h1 className="display-l">Every debate, frozen as it happened.</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-2">Replays use the stored transcript, citations, audio and evidence snapshot. They never call the AI or fetch new data, so a replay shows exactly what the audience saw.</p>

      <form method="get" action="/library" className="mt-10 grid gap-3 rounded-[var(--radius-lg)] border hairline p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
        <label className="grid gap-1.5 text-xs text-muted">Topic
          <select name="topic" defaultValue={topic ?? ''} className="h-10 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-sm text-fg">
            <option value="">All topics</option>
            {TOPICS.map((t) => <option key={t.slug} value={t.slug}>{t.shortLabel}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs text-muted">Verdict
          <select name="winner" defaultValue={winner ?? ''} className="h-10 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-sm text-fg">
            <option value="">Any verdict</option>
            <option value="bull">Bull wins</option>
            <option value="bear">Bear wins</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs text-muted">From
          <input type="date" name="from" defaultValue={from} className="h-10 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-sm text-fg [color-scheme:dark]" />
        </label>
        <label className="grid gap-1.5 text-xs text-muted">To
          <input type="date" name="to" defaultValue={to} className="h-10 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-sm text-fg [color-scheme:dark]" />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary h-10 min-h-0">Apply</button>
          {filtered && <Link href="/library" className="btn btn-ghost h-10 min-h-0">Clear</Link>}
        </div>
      </form>

      <div className="mt-8">
        {!result ? (
          <Notice tone="error" title="The library is unavailable right now.">The database did not respond. Please try again shortly.</Notice>
        ) : result.entries.length ? (
          <>
            <ul className="grid gap-3 md:grid-cols-2">{result.entries.map((e) => <LibraryRow key={e.id} e={e} />)}</ul>
            <div className="mt-6 flex justify-between gap-3">
              {cursor ? <Link href={qs({})} className="btn btn-ghost">← Newest</Link> : <span />}
              {result.nextCursor && <Link href={qs({ cursor: result.nextCursor })} className="btn btn-ghost">Older debates →</Link>}
            </div>
          </>
        ) : (
          <EmptyState title={filtered ? 'No debates match these filters.' : 'No public debates yet.'} action={filtered ? { href: '/library', label: 'Clear filters' } : { href: '/#topics', label: 'Start a debate' }}>
            {filtered ? 'Try a wider date range or another verdict.' : 'Completed debates are listed here automatically. Nothing is pre-seeded.'}
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
