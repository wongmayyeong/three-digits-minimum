import Link from 'next/link';
import { ArenaIdle } from '@/components/arena-idle';
import { StarField } from '@/components/brand';
import { AsOf, Container, EmptyState, SectionHead, StatValue } from '@/components/ui';
import { LibraryRow } from '@/components/library-row';
import { previewTopic, type TopicPreview } from '@/lib/debate/preview';
import { listLibrary } from '@/lib/debate/view';
import { formatDate, formatValue } from '@/lib/format';
import { TOPICS } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

const HEADLINES: Record<string, { id: string; caption: string }[]> = {
  'intents-bet': [
    { id: 'INT-VOL-90D', caption: 'Intents volume, 90 days' },
    { id: 'MODEL-BUYBACK-TO-MCAP', caption: 'Buyback demand / market cap, per year' },
  ],
  'growth-or-hype': [
    { id: 'MKT-NEAR-MCAP', caption: 'Circulating market cap' },
    { id: 'ACT-DAA-YOY', caption: 'Daily active accounts vs a year ago' },
  ],
  'long-game': [
    { id: 'PEER-NEAR-MCAP-TO-FEES', caption: 'NEAR market cap / chain fees' },
    { id: 'PEER-SOL-MCAP-TO-FEES', caption: 'Solana market cap / chain fees' },
  ],
};

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}

export default async function Home() {
  const [previews, library] = await Promise.all([
    Promise.all(TOPICS.map((t) => safe(previewTopic(t.slug, { offline: true })))),
    safe(listLibrary({ limit: 4 })),
  ]);
  const byTopic = Object.fromEntries(TOPICS.map((t, i) => [t.slug, previews[i] ?? null])) as Record<string, TopicPreview | null>;
  const intents = byTopic['intents-bet'];
  const item = (p: TopicPreview | null, id: string) => p?.items.find((i) => i.evidenceId === id) ?? null;
  const base = intents?.scenarios?.find((s) => s.key === 'base') ?? null;

  return (
    <>
      <section className="relative overflow-hidden border-b hairline">
        <StarField count={30} seed={3} className="opacity-70" />
        <Container className="relative grid gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <p className="eyebrow mb-6">AI debate arena · NEAR investment research</p>
            <h1 className="display-xl text-balance">Every claim has an opponent.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-2 md:text-xl">Three minds. One evidence trail. Your NEAR thesis, on trial.</p>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
              Bull and Bear argue from the same frozen snapshot of live onchain and market data. Every figure they cite is checked by the server, and a neutral Judge scores the evidence, not the conviction.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#topics" className="btn btn-primary">Enter the Arena</Link>
              {library?.entries[0] ? (
                <Link href={`/debates/${library.entries[0].id}`} className="btn btn-ghost">Watch the latest replay</Link>
              ) : (
                <Link href="/methodology" className="btn btn-ghost">How it is judged</Link>
              )}
            </div>
          </div>
          <ArenaIdle />
        </Container>
      </section>

      <Container className="py-20" >
        <SectionHead eyebrow="Three questions" title="Pick the argument you want tested." id="topics">
          Each debate freezes its own evidence snapshot at the start. Figures below come from the most recent stored source responses; a debate fetches fresh ones.
        </SectionHead>
        <ol className="grid gap-4 lg:grid-cols-3">
          {TOPICS.map((t) => {
            const p = byTopic[t.slug] ?? null;
            const avail = p ? p.items.filter((i) => i.available).length : null;
            return (
              <li key={t.slug} className="panel group relative flex flex-col p-6 transition-colors hover:border-line-strong">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="num text-sm text-muted">0{t.order}</span>
                  {avail !== null && p && <span className="text-xs text-muted"><span className="num">{avail}/{p.items.length}</span> evidence items available</span>}
                </div>
                <h3 className="mt-5 text-2xl font-[600] tracking-[-0.02em]">{t.shortLabel}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-2">{t.title}</p>
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t hairline pt-5">
                  {HEADLINES[t.slug]!.map((h) => {
                    const it = item(p, h.id);
                    return (
                      <div key={h.id}>
                        <dt className="text-xs leading-snug text-muted">{h.caption}</dt>
                        <dd className="mt-1.5 text-xl"><StatValue value={it?.value ?? null} unit={it?.unit ?? 'USD'} /></dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-3 text-xs text-muted">{p?.newestSourceAt ? <>Sources stored <AsOf date={p.newestSourceAt} prefix="on" /></> : 'No stored source data yet; the topic page fetches it.'}</p>
                <Link href={`/topics/${t.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-[560] text-mint after:absolute after:inset-0 after:content-['']">
                  Open the case <span aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Container>

      <section className="border-y hairline bg-surface">
        <Container className="py-20">
          <SectionHead eyebrow="How a debate is built" title="Opinions are cheap. Citations are checked.">
            The AI agents never browse. They argue over one immutable snapshot, and everything they say is held to it.
          </SectionHead>
          <ol className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line md:grid-cols-4">
            {[
              ['Freeze', 'Live data from DefiLlama, CoinGecko, NearBlocks and NEAR RPC is fetched, hashed and frozen into a snapshot. Missing sources are marked unavailable, never filled in.'],
              ['Compute', 'The server computes every ratio and the break-even demand model deterministically. The AI cannot invent a number the model did not produce.'],
              ['Argue', 'Bull and Bear open, rebut and close. Every claim must cite evidence IDs; the server rejects unknown IDs and flags numbers that match nothing.'],
              ['Judge', 'The Judge scores each side on a fixed rubric and challenges the model inputs. Citation penalties are applied by code, not by the model.'],
            ].map(([h, b], i) => (
              <li key={h} className="bg-surface p-6">
                <span className="num text-xs text-mint">0{i + 1}</span>
                <p className="mt-3 text-lg font-[600]">{h}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="eyebrow mb-3">The central question</p>
            <h2 className="display-m text-balance">How much volume would buybacks need?</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-fg-2">
              NEBUBE does not predict price. It asks what measurable activity would be required for NEAR Intents revenue to fund buybacks worth a chosen share of market cap, and lets Bull and Bear fight over the inputs.
            </p>
            <pre className="num mt-6 overflow-x-auto rounded-[var(--radius-md)] border hairline bg-surface p-4 text-[0.8125rem] leading-6 text-fg-2">{`annual_buyback_demand = V × f × c × b
buyback_to_mcap       = demand ÷ M
break_even_volume     = (y × M) ÷ (f × c × b)`}</pre>
            <Link href="/methodology#model" className="mt-5 inline-flex text-sm font-[560] text-mint">Explore the model and calculator →</Link>
          </div>
          <div className="panel p-6">
            <p className="eyebrow">Base case from stored data</p>
            {base && intents ? (
              <>
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                  <div><dt className="text-xs text-muted">Annual buyback demand</dt><dd className="mt-1 text-2xl"><StatValue value={base.outputs.annualBuybackDemandUsd} unit="USD" /></dd></div>
                  <div><dt className="text-xs text-muted">As a share of market cap</dt><dd className="mt-1 text-2xl"><StatValue value={base.outputs.buybackDemandToMcap} unit="fraction" /></dd></div>
                  <div><dt className="text-xs text-muted">Volume needed for 2% (hypothetical)</dt><dd className="mt-1 text-2xl"><StatValue value={base.outputs.breakEvenAnnualVolumeUsd} unit="USD" /></dd></div>
                  <div><dt className="text-xs text-muted">Multiple of today&apos;s run rate</dt><dd className="mt-1 text-2xl"><StatValue value={base.outputs.volumeMultipleRequired} unit="ratio" /></dd></div>
                </dl>
                <p className="mt-6 border-t hairline pt-4 text-xs leading-relaxed text-muted">
                  Inputs: V {formatValue(base.inputs.V.value, 'USD')} (90-day run rate), f {formatValue(base.inputs.f.value, 'fraction')}, c {formatValue(base.inputs.c.value, 'fraction')}, b {formatValue(base.inputs.b.value, 'fraction')} (DefiLlama classification), M {formatValue(base.inputs.M.value, 'USD')}. Window ends {formatDate(intents.windowEnd)}. A buyback is not a burn and does not move price one-for-one.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-muted">No stored source data yet. Open The Intents Bet to fetch live data and compute the base case.</p>
            )}
          </div>
        </div>
      </Container>

      <Container className="pb-4">
        <SectionHead eyebrow="Replay library" title="Recent debates">
          Every completed debate keeps its evidence snapshot frozen forever. Replays never call the AI or re-fetch data.
        </SectionHead>
        {library && library.entries.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {library.entries.map((e) => <LibraryRow key={e.id} e={e} />)}
          </ul>
        ) : (
          <EmptyState title="No public debates yet." action={{ href: '/topics/intents-bet', label: 'Start the first debate' }}>
            Completed debates appear here with their verdict, scores and frozen snapshot. Nothing is pre-seeded.
          </EmptyState>
        )}
      </Container>
    </>
  );
}
