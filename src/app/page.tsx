import Link from 'next/link';
import { ArenaIdle } from '@/components/arena-idle';
import { StarField } from '@/components/brand';
import { LibraryRow } from '@/components/library-row';
import { ScenarioTable } from '@/components/scenario-table';
import { Theatre } from '@/components/theatre/theatre';
import { AsOfLine, EraCharts, EraTable, EventTable, FinalVerdictLabel, SectionBadge, SectionHeader, SupplyStats, TriggerTable } from '@/components/thesis';
import { Container, EmptyState, Notice } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { listLibrary, loadDebateView } from '@/lib/debate/view';
import { formatDate, formatValue } from '@/lib/format';
import { PIVOTS, RULES, THESIS_SUBTITLE, THESIS_TITLE } from '@/lib/research/thesis';
import { evaluateTriggers } from '@/lib/research/triggers';
import { THESIS_TOPIC } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

export default async function ThesisPage() {
  const [preview, episodes] = await Promise.all([
    previewTopic(THESIS_TOPIC.slug, { offline: true }).catch(() => null),
    listLibrary({ limit: 6 }).catch(() => null),
  ]);
  const latest = episodes?.entries[0] ? await loadDebateView(episodes.entries[0].id).catch(() => null) : null;
  const t = preview?.thesis ?? null;
  const triggers = preview ? evaluateTriggers(preview.items) : [];
  const item = (id: string) => preview?.items.find((i) => i.evidenceId === id) ?? null;

  return (
    <>
      <section className="relative overflow-hidden border-b hairline">
        <StarField count={30} seed={3} className="opacity-60" />
        <Container className="relative py-14 md:py-20">
          <p className="eyebrow mb-5">NEAR investment thesis · reproducible research</p>
          <h1 className="display-xl max-w-5xl text-balance">{THESIS_TITLE}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-2 md:text-xl">{THESIS_SUBTITLE}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {t && (
              <p className="text-base">
                <span className="text-muted">Current verdict: </span>
                <span className="font-[620]"><FinalVerdictLabel verdict={t.verdict} /></span>
                <span className="text-muted"> · {t.confidence} confidence</span>
              </p>
            )}
            <a href="#verdict" className="text-sm text-mint">Jump to the verdict ↓</a>
          </div>
          {preview && <div className="mt-3"><AsOfLine newest={preview.newestSourceAt} windowEnd={preview.windowEnd} /></div>}
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted">Educational research, not financial advice. Not affiliated with the NEAR Foundation. Every figure links to its source; the verdict is computed by published rules, not written by AI.</p>
        </Container>
      </section>

      <Container className="py-10 md:py-14" >
        <section aria-labelledby="debate-h">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">The debate</p>
              <h2 id="debate-h" className="text-2xl font-[600] tracking-[-0.02em]">Bull and Bear argue it out. The Judge scores the evidence.</h2>
            </div>
            <a href="#pivots" className="text-sm text-muted hover:text-fg">Skip to the research ↓</a>
          </div>
          {latest && latest.status === 'COMPLETE' ? (
            <Theatre initial={latest} variant="embed" />
          ) : (
            <div className="space-y-3">
              <ArenaIdle />
              <p className="text-sm text-muted">The first debate episode appears here once it is generated from a frozen snapshot of the research below. Episodes are regenerated only when the verdict changes.</p>
            </div>
          )}
        </section>

        {!preview || !t ? (
          <div className="mt-14"><Notice tone="warn" title="Research data is not available yet.">No stored source responses were found. Run the research refresh (npm run refresh:now) or wait for the daily refresh.</Notice></div>
        ) : (
          <>
            <section id="pivots" className="mt-16 scroll-mt-20" aria-labelledby="pivots-h">
              <header className="mb-8 border-t hairline pt-10">
                <p className="eyebrow mb-3"><span className="text-mint">00</span> · The pivots</p>
                <h2 id="pivots-h" className="display-m max-w-3xl text-balance">From scalable L1 to Social, Chain Abstraction, Intents and AI.</h2>
                <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-fg-2">Dates are taken from NEAR&apos;s own announcements. Each era&apos;s representative contract is measured onchain below; the AI era has no single contract to measure, which is stated rather than estimated.</p>
              </header>
              <ol className="grid gap-3 md:grid-cols-4">
                {PIVOTS.map((p) => (
                  <li key={p.id} className="panel p-5">
                    <p className="num text-xs text-mint">{p.shown}</p>
                    <p className="mt-2 font-[600]">{p.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{p.note}</p>
                    <a href={p.source} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-fg-2 underline decoration-line-strong underline-offset-2 hover:decoration-mint">Official source</a>
                  </li>
                ))}
              </ol>
            </section>

            <section id="lasted" className="mt-16 scroll-mt-20">
              <SectionHeader n={1} title="Product" question="Did it last? Does each era's product keep real usage after the narrative moves on?" verdict={t.sections[0]!.verdict} reason={t.sections[0]!.reason} howHref="/methodology#thesis" />
              <EraCharts eras={t.eras} />
              <div className="mt-4"><EraTable eras={t.eras} /></div>
              <p className="mt-3 text-xs leading-relaxed text-muted">Rule: an era &quot;lasted&quot; if its latest complete month keeps at least {RULES.eraRetentionLasting * 100}% of its own peak month, judged once the peak is {RULES.eraMinMonthsSincePeak}+ months old. Transactions are not people: relayers, solvers and MPC node responses are included. A decline can also mean migration to a newer product, so this measures whether usage stayed, not why it left.{preview.eraMonthsStored < preview.eraMonthsTotal ? ` ${preview.eraMonthsStored} of ${preview.eraMonthsTotal} monthly counts are stored so far; the rest arrive with the daily refresh.` : ''}</p>
            </section>

            <section id="adoption" className="mt-16 scroll-mt-20">
              <SectionHeader n={2} title="Market" question="Did adoption justify the hype? Did real usage follow each pivot within 90 days?" verdict={t.sections[1]!.verdict} reason={t.sections[1]!.reason} howHref="/methodology#thesis" />
              <EventTable events={t.events} />
              <p className="mt-3 text-xs leading-relaxed text-muted">Adoption followed a pivot if daily active accounts (mean of days 60 to 90 after) beat the 30 days before, or the era&apos;s product activity at least {RULES.eraGrowthMultiple}x&apos;d from its launch month to two months later. The NEAR-minus-BTC return is shown as market context only and is not scored: prices can move ahead of adoption for good reasons. This section sets confidence; it does not decide the verdict.</p>
            </section>

            <section id="pays" className="mt-16 scroll-mt-20">
              <SectionHeader n={3} title="Investment" question="Does it pay $NEAR? Does today's activity return value to the token?" verdict={t.sections[2]!.verdict} reason={t.sections[2]!.reason} howHref="/methodology#model" />
              <SupplyStats s={t.supply} />
              <p className="mt-3 text-xs leading-relaxed text-muted">Paying the token if buybacks absorb at least {RULES.coveragePaying * 100}% of realized net new supply; not paying below {RULES.coverageNotPaying * 100}%. For comparison, burns plus buybacks cover {formatValue(t.supply.maxIssuanceCoverage, 'fraction')} of maximum possible issuance. A buyback is not a burn: bought tokens are held in {formatValue(item('ONC-BUYBACK-WALLET')?.value ?? null, 'NEAR')} at the buyback wallet.</p>
              {preview.scenarios && (
                <div className="mt-8">
                  <h3 className="mb-1 text-lg font-[600]">What would it take? The break-even demand model</h3>
                  <p className="mb-4 max-w-3xl text-sm text-muted">Annual Intents volume needed for buybacks to reach a hypothetical 2% of market cap, under three assumption sets. Today&apos;s run rate is {formatValue(item('INT-VOL-ANN')?.value ?? null, 'USD')}. <Link href="/methodology#calculator" className="text-mint">Try your own assumptions →</Link></p>
                  <ScenarioTable scenarios={preview.scenarios.map((s) => ({ key: s.key, label: s.label, inputs: { rationale: s.rationale }, outputs: s.outputs as unknown as Record<string, unknown> }))} />
                </div>
              )}
            </section>

            <section id="verdict" className="mt-16 scroll-mt-20" aria-labelledby="verdict-h">
              <header className="mb-8 border-t hairline pt-10">
                <p className="eyebrow mb-3"><span className="text-mint">04</span> · The verdict</p>
                <h2 id="verdict-h" className="display-l text-balance"><FinalVerdictLabel verdict={t.verdict} /></h2>
                <p className="mt-3 text-sm text-muted">{t.confidence === 'moderate' ? 'Moderate' : 'Low'} confidence · computed from the data as of {formatDate(preview.windowEnd)}</p>
              </header>
              <div className="grid gap-4 md:grid-cols-3">
                {t.sections.map((s) => (
                  <div key={s.id} className="panel p-5">
                    <p className="num text-xs text-faint">0{s.id}</p>
                    <p className="mt-1 font-[600]">{s.title}</p>
                    <div className="mt-3"><SectionBadge verdict={s.verdict} /></div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{s.reason}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-fg-2">Sections 1 and 3 decide the verdict: building requires both lasting products and value returning to the token. Section 2 only raises or lowers confidence. If either core section lacks data, the verdict is &quot;insufficient evidence&quot; rather than a guess. The rules and thresholds are published in the methodology. They were written while the pipeline was built, after some data had been seen, so they are not a blind pre-registration; anyone can change them and rebuild.</p>
              <h3 className="mb-3 mt-10 text-lg font-[600]">What would change this verdict</h3>
              <TriggerTable triggers={triggers} />
            </section>

            <section id="episodes" className="mt-16 scroll-mt-20" aria-labelledby="ep-h">
              <h2 id="ep-h" className="mb-4 border-t hairline pt-10 text-lg font-[600]">Debate episodes</h2>
              {episodes?.entries.length ? (
                <ul className="grid gap-3 md:grid-cols-2">{episodes.entries.map((e) => <LibraryRow key={e.id} e={e} />)}</ul>
              ) : (
                <EmptyState title="No debate episodes yet.">Each episode is generated from a frozen snapshot and kept permanently, so you can compare how the argument changed as the evidence changed.</EmptyState>
              )}
            </section>

            <nav aria-label="Go deeper" className="mt-16 grid gap-3 border-t hairline pt-10 md:grid-cols-2">
              <Link href="/research" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Data &amp; queries</p><p className="mt-2 font-[600]">Every chart, the request behind it, and the raw hashes</p></Link>
              <Link href="/methodology" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Methodology</p><p className="mt-2 font-[600]">Rules, formulas, calculator and known limitations</p></Link>
            </nav>
          </>
        )}
      </Container>
    </>
  );
}
