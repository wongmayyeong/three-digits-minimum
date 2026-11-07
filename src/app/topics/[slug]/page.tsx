import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LibraryRow } from '@/components/library-row';
import { StartDebateButton } from '@/components/start-debate';
import { TopicLive } from '@/components/topic-live';
import { Container, EmptyState, Notice } from '@/components/ui';
import { resolveLlm } from '@/lib/ai/provider';
import { voiceStatus } from '@/lib/audio/voices';
import { previewTopic } from '@/lib/debate/preview';
import { listLibrary } from '@/lib/debate/view';
import { formatValue } from '@/lib/format';
import { getTopic, TOPICS } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTopic((await params).slug);
  return t ? { title: t.shortLabel, description: t.question } : { title: 'Topic not found' };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();
  const [preview, library] = await Promise.all([
    previewTopic(slug, { offline: true }).catch(() => null),
    listLibrary({ topic: slug, limit: 6 }).catch(() => null),
  ]);
  const llm = resolveLlm().status;
  const voice = voiceStatus();
  const others = TOPICS.filter((t) => t.slug !== slug);

  return (
    <>
      <section className="border-b hairline">
        <Container className="py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted"><Link href="/#topics" className="hover:text-fg">Arena</Link> <span aria-hidden="true">/</span> <span className="text-fg-2">{topic.shortLabel}</span></nav>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div>
              <p className="eyebrow mb-4">Topic 0{topic.order} · {topic.shortLabel}</p>
              <h1 className="display-l text-balance">{topic.question}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-2">{topic.framing}</p>
            </div>
            <div className="flex flex-col justify-end gap-4 lg:items-end">
              <StartDebateButton topic={slug} available={llm.configured} unavailableReason={llm.configured ? null : 'AI debates are not configured on this deployment (no language model key).'} label="Start debate" />
              <ul className="space-y-1 text-xs text-muted lg:text-right">
                <li>About 2 to 3 minutes to generate · watch it build live</li>
                <li>{voice.configured ? 'Three AI voices (ElevenLabs), muted until you turn sound on' : 'Captions, plus your device’s browser voice if you turn sound on'}</li>
                {llm.provider === 'fixture' && <li className="text-amber">Local synthetic fixture mode: debates are template text, not AI.</li>}
              </ul>
            </div>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="panel relative overflow-hidden p-6">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-mint" aria-hidden="true" />
              <p className="eyebrow text-mint">Bull hypothesis</p>
              <p className="mt-3 leading-relaxed text-fg-2">{topic.bullHypothesis}</p>
            </div>
            <div className="panel relative overflow-hidden p-6">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-coral" aria-hidden="true" />
              <p className="eyebrow text-coral">Bear hypothesis</p>
              <p className="mt-3 leading-relaxed text-fg-2">{topic.bearHypothesis}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <TopicLive slug={slug} initial={preview} />

        {topic.usesModel && preview?.scenarios && (
          <section className="mt-14" aria-labelledby="model-h">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="model-h" className="text-lg font-[600]">Break-even demand model, current inputs</h2>
              <Link href="/methodology#model" className="text-sm text-mint">Adjust assumptions in the calculator →</Link>
            </div>
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-raised text-xs text-muted">
                  <tr><th scope="col" className="px-4 py-2.5 font-normal">Scenario</th><th scope="col" className="px-4 py-2.5 text-right font-normal">Annual buyback demand</th><th scope="col" className="px-4 py-2.5 text-right font-normal">Buyback / market cap</th><th scope="col" className="px-4 py-2.5 text-right font-normal">Volume multiple for 2%</th></tr>
                </thead>
                <tbody>
                  {preview.scenarios.map((s) => (
                    <tr key={s.key} className="border-t hairline">
                      <th scope="row" className="px-4 py-3 font-normal"><span className="font-[560]">{s.label}</span><p className="mt-0.5 max-w-md text-xs leading-snug text-muted">{s.rationale}</p></th>
                      <td className="num px-4 py-3 text-right">{formatValue(s.outputs.annualBuybackDemandUsd, 'USD')}</td>
                      <td className="num px-4 py-3 text-right">{formatValue(s.outputs.buybackDemandToMcap, 'fraction')}</td>
                      <td className="num px-4 py-3 text-right">{formatValue(s.outputs.volumeMultipleRequired, 'ratio')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">Scenario adjustments (fee compression, capture haircut, buyback share, growth, the 2% target) are assumptions, not evidence. The model computes required activity; it does not forecast price.</p>
          </section>
        )}

        <section className="mt-14" aria-labelledby="past-h">
          <h2 id="past-h" className="mb-4 text-lg font-[600]">Past debates on this topic</h2>
          {library?.entries.length ? (
            <ul className="grid gap-3 md:grid-cols-2">{library.entries.map((e) => <LibraryRow key={e.id} e={e} />)}</ul>
          ) : library ? (
            <EmptyState title="No completed debates on this topic yet.">Start one above. When it finishes it is listed here and in the replay library, with its frozen snapshot.</EmptyState>
          ) : (
            <Notice tone="warn" title="The debate library is unreachable right now.">The database did not respond. Try again shortly.</Notice>
          )}
        </section>

        <nav aria-label="Other topics" className="mt-14 grid gap-3 border-t hairline pt-8 md:grid-cols-2">
          {others.map((o) => (
            <Link key={o.slug} href={`/topics/${o.slug}`} className="panel p-5 transition-colors hover:border-line-strong">
              <p className="eyebrow">Topic 0{o.order}</p>
              <p className="mt-2 font-[600]">{o.shortLabel}</p>
              <p className="mt-1 text-sm text-muted">{o.title}</p>
            </Link>
          ))}
        </nav>
      </Container>
    </>
  );
}
