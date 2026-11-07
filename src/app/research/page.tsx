import type { Metadata } from 'next';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EvidenceChart } from '@/components/evidence-chart';
import { EvidenceTable } from '@/components/evidence-list';
import { Container, ExternalLink, Notice } from '@/components/ui';
import { previewTopic, type TopicPreview } from '@/lib/debate/preview';
import { formatDate, formatDateTime, formatValue, pct } from '@/lib/format';
import { TOPICS } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Research dashboard', description: 'Every NEBUBE chart with the exact query behind it, refreshed from public NEAR data sources.' };

function sentence(label: string, unit: string, points: [string, number][]): string {
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const change = first[1] !== 0 ? (last[1] - first[1]) / Math.abs(first[1]) : null;
  return `${label} was ${formatValue(last[1], unit)} in the week ending ${formatDate(last[0])}, ${change === null ? 'with no comparable starting value' : `${change >= 0 ? 'up' : 'down'} ${pct(Math.abs(change), 0)} from ${formatValue(first[1], unit)} in the week ending ${formatDate(first[0])}`}.`;
}

function sqlFiles(): { name: string; sql: string }[] {
  try {
    const dir = join(process.cwd(), 'research', 'sql');
    return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => ({ name: f, sql: readFileSync(join(dir, f), 'utf8') }));
  } catch {
    return [];
  }
}

export default async function ResearchPage() {
  const previews = (await Promise.all(TOPICS.map((t) => previewTopic(t.slug, { offline: true }).catch(() => null)))).filter((p): p is TopicPreview => !!p);
  const items = new Map<string, TopicPreview['items'][number]>();
  for (const p of previews) for (const i of p.items) items.set(i.evidenceId, i);
  const sources = previews[0]?.sources ?? [];
  const charted = [...items.values()].filter((i) => i.available && i.series && i.series.points.length > 4);
  const queryFor = (hash: string | null | undefined) => sources.find((s) => s.sha256 && s.sha256 === hash)?.url ?? null;
  const sql = sqlFiles();

  return (
    <Container className="py-12 md:py-16">
      <p className="eyebrow mb-3">Research dashboard</p>
      <h1 className="display-l text-balance">Every chart, with the query behind it.</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Charts are built from the most recently stored source responses. Run <code className="num rounded-[var(--radius-xs)] bg-raised px-1.5 py-0.5 text-sm">npm run research:refresh</code> to rebuild every number and chart from raw data, or <code className="num rounded-[var(--radius-xs)] bg-raised px-1.5 py-0.5 text-sm">npm run research:rebuild</code> to reproduce them offline from the committed snapshot.</p>
      {previews[0]?.newestSourceAt && <p className="mt-3 text-sm text-muted">Latest stored source response: {formatDateTime(previews[0].newestSourceAt)}.</p>}

      {!previews.length ? (
        <div className="mt-10"><Notice tone="warn" title="No stored research data yet.">Open a topic page or run the research command to fetch sources.</Notice></div>
      ) : (
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {charted.map((c) => {
            const q = queryFor(c.rawResponseHash);
            return (
              <article key={c.evidenceId} className="panel flex flex-col p-5">
                <h2 className="text-base font-[600]">{c.series!.label}</h2>
                <p className="num mb-3 text-[0.6875rem] text-faint">{c.evidenceId} · {c.sourceName}</p>
                <EvidenceChart series={c.series!} source={c.sourceName} />
                <p className="mt-3 text-sm leading-relaxed text-fg-2">{sentence(c.series!.label, c.series!.unit, c.series!.points)}</p>
                <p className="mt-3 break-all text-xs text-muted">Query: <span className="num text-faint">{q ? `GET ${q}` : 'see source link'}</span></p>
                <p className="mt-1 text-xs"><ExternalLink href={c.sourceUrl}>{c.sourceName}</ExternalLink></p>
              </article>
            );
          })}
        </div>
      )}

      {previews.length > 0 && (
        <section className="mt-16">
          <h2 className="display-m">Evidence register (all topics)</h2>
          <p className="mt-2 text-sm text-muted">Values from stored responses; a debate freezes its own copy.</p>
          <div className="mt-6"><EvidenceTable items={[...items.values()]} /></div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="display-m">BigQuery queries</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">Parameterized SQL against <span className="num">bigquery-public-data.crypto_near_mainnet_us</span>. Every query filters on the <span className="num">block_date</span> partition, is dry-run first, and is refused above the configured byte limit. They need your Google Cloud credentials and billing, so they are not part of live snapshots. Run <span className="num">01_freshness.sql</span> first: NEAR Lake, the dataset&apos;s upstream, stopped indexing new blocks on 2026-03-24.</p>
        <div className="mt-6 space-y-4">
          {sql.map((f) => (
            <details key={f.name} className="panel p-4">
              <summary className="num cursor-pointer text-sm text-fg">{f.name}</summary>
              <pre className="num mt-3 overflow-x-auto text-xs leading-6 text-fg-2">{f.sql}</pre>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
