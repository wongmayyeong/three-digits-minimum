import Link from 'next/link';
import { HeroDebate } from '@/components/hero-debate';
import { LibraryRow } from '@/components/library-row';
import { ScenarioTable } from '@/components/scenario-table';
import { AsOfLine, EraCharts, EraTable, EventTable, FinalVerdictLabel, SectionBadge, SectionHeader, SupplyStats, TriggerTable } from '@/components/thesis';
import { Container, EmptyState, Notice } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { listLibrary, loadDebateView } from '@/lib/debate/view';
import { formatDate, formatValue } from '@/lib/format';
import { PIVOTS, RULES, THESIS_SUBTITLE, THESIS_TITLE, type FinalVerdict } from '@/lib/research/thesis';
import { evaluateTriggers } from '@/lib/research/triggers';
import { THESIS_TOPIC } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

const VERDICT_TEXT: Record<FinalVerdict, string> = {
  BUILDING: 'Building the future',
  'FOLLOWING THE HYPE': 'Following the hype',
  'BUILDING, NOT YET PAYING': 'Technology is building; the investment case is unproven',
  'PAYING, NOT LASTING': 'The token is paid, but products are not lasting',
  MIXED: 'Mixed evidence',
  'INSUFFICIENT EVIDENCE': 'Insufficient evidence',
};
const VERDICT_TONE: Record<FinalVerdict, 'mint' | 'coral' | 'amber' | 'muted'> = {
  BUILDING: 'mint', 'FOLLOWING THE HYPE': 'coral', 'BUILDING, NOT YET PAYING': 'amber', 'PAYING, NOT LASTING': 'amber', MIXED: 'amber', 'INSUFFICIENT EVIDENCE': 'muted',
};

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
      <HeroDebate
        episode={latest && latest.status === 'COMPLETE' ? latest : null}
        title={THESIS_TITLE}
        subtitle={THESIS_SUBTITLE}
        verdict={t ? VERDICT_TEXT[t.verdict] : null}
        verdictTone={t ? VERDICT_TONE[t.verdict] : 'muted'}
        confidence={t?.confidence ?? null}
        asOf={preview?.windowEnd ? formatDate(preview.windowEnd) : null}
      />

      <Container className="py-10 md:py-14" >
        {preview && <AsOfLine newest={preview.newestSourceAt} windowEnd={preview.windowEnd} />}

        {!preview || !t ? (
          <div className="mt-14"><Notice tone="warn" title="Research data is not available yet.">No stored source responses were found. Run the research refresh (npm run refresh:now) or wait for the daily refresh.</Notice></div>
        ) : (
          <>
            <section aria-labelledby="summary-h" className="mt-8">
              <h2 id="summary-h" className="sr-only">The question and the three answers</h2>
              <p className="max-w-3xl text-lg leading-relaxed text-fg md:text-xl">NEAR has changed what it wants to become several times: a scalable L1, then Social, Chain Abstraction, Intents and AI. This page asks three questions of public onchain and market data. Did each era&apos;s product keep being used? Did adoption follow each pivot once the product was live? Does today&apos;s activity return value to $NEAR holders?</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {t.sections.map((s) => (
                  <a key={s.id} href={['#lasted', '#adoption', '#pays'][s.id - 1]} className="panel block p-4 transition-colors hover:border-line-strong">
                    <p className="num text-xs text-faint">0{s.id} · {s.title}</p>
                    <div className="mt-2"><SectionBadge verdict={s.verdict} /></div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.reason}</p>
                  </a>
                ))}
              </div>
            </section>

            <section id="pivots" className="mt-14 scroll-mt-20" aria-labelledby="pivots-h">
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
              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                <aside className="panel border-coral/40 p-5" aria-labelledby="daa-h">
                  <p className="eyebrow text-coral">Open question · not yet explained</p>
                  <h3 id="daa-h" className="mt-2 text-lg font-[600]">Base-layer active accounts are down {formatValue(item('ACT-DAA-YOY')?.value === undefined || item('ACT-DAA-YOY')?.value === null ? null : Math.abs(item('ACT-DAA-YOY')!.value!), 'fraction')} in a year</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">Daily active accounts averaged {formatValue(item('ACT-DAA-30D')?.value ?? null, 'count')} over the last 30 days, against {formatValue(item('ACT-DAA-30D-1Y-AGO')?.value ?? null, 'count')} a year earlier (NearBlocks). This study does not yet separate the causes: activity a year ago that was incentive- or bot-driven, workloads moving into Intents or to other chains through Chain Signatures (which shows up as fewer base-layer accounts), or users leaving. Until it does, this weakens the building case, and falsification trigger F4 is triggered. Accounts are not people.</p>
                </aside>
                <aside className="panel p-5" aria-labelledby="exploit-h">
                  <p className="eyebrow">Execution risk · reported, not scored</p>
                  <h3 id="exploit-h" className="mt-2 text-lg font-[600]">NEAR Intents exploit, 1 October 2026</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">NEAR Intents paused deposits and withdrawals on 11 networks after an exploit of about $3.8M, caused by a flaw in how its Omni deposit and withdrawal service interacted with the Intents contract; the flaw was reported as patched. The team pledged full compensation; recovery of the funds has not been independently confirmed. It is a reliability and trust risk for the product this thesis depends on most, not evidence that the strategy failed. <a href="https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404" target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-line-strong underline-offset-2 hover:decoration-mint">The Block</a> · <a href="https://en.coinotag.com/near-intents-exploit-climbs-to-3-8m-pausing-near-cross-chain-swaps" target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-line-strong underline-offset-2 hover:decoration-mint">recovery status</a></p>
                </aside>
              </div>
            </section>

            <section id="adoption" className="mt-16 scroll-mt-20">
              <SectionHeader n={2} title="Market" question="Did adoption justify the hype? Did each pivot’s product get used once it was live?" verdict={t.sections[1]!.verdict} reason={t.sections[1]!.reason} howHref="/methodology#thesis" />
              <EventTable events={t.events} />
              <p className="mt-3 text-xs leading-relaxed text-muted">Scored on the product from its mainnet launch, not the announcement: adoption followed if the product contract&apos;s monthly activity two months later reached at least {RULES.eraGrowthMultiple}x its launch month. Chain Signatures is measured from its 8 August 2024 mainnet release, not the March 2024 announcement. User-Owned AI has no single product contract, so it is N/A and left out of the count rather than scored as a failure. Chain-wide active accounts and the NEAR-minus-BTC return are context only: neither can be attributed to one product. This section sets confidence; it does not decide the verdict.</p>
            </section>

            <section id="pays" className="mt-16 scroll-mt-20">
              <SectionHeader n={3} title="Investment" question="Does it pay $NEAR? Does today's activity return value to the token?" verdict={t.sections[2]!.verdict} reason={t.sections[2]!.reason} howHref="/methodology#model" />
              <SupplyStats s={t.supply} />
              <p className="mt-3 text-xs leading-relaxed text-muted">Paying the token if buyback-designated revenue equals at least {RULES.coveragePaying * 100}% of the value of realized net new supply; not paying below {RULES.coverageNotPaying * 100}%. For comparison, burns plus buybacks cover {formatValue(t.supply.maxIssuanceCoverage, 'fraction')} of maximum possible issuance. A buyback is not a burn: bought tokens are held at the buyback wallet. The revenue figures are DefiLlama&apos;s buyback designation, not verified trades; as an onchain cross-check, the wallet holds {formatValue(t.supply.walletNear, 'NEAR')} ({formatValue(t.supply.walletUsd, 'USD')} at today&apos;s price), {formatValue(t.supply.walletVsDesignated, 'fraction')} of the {formatValue(t.supply.designatedSinceStartUsd, 'USD')} designated since {t.supply.designatedStart ?? 'n/a'}.</p>
              {preview.scenarios && (
                <div className="mt-8">
                  <h3 className="mb-1 text-lg font-[600]">What would it take? The buyback demand target model</h3>
                  <p className="mb-4 max-w-3xl text-sm text-muted">Annual Intents volume needed for buyback-designated revenue to reach a hypothetical target of 2% of market cap a year, under three assumption sets. This is a demand target, not a supply break-even. Today&apos;s run rate is {formatValue(item('INT-VOL-ANN')?.value ?? null, 'USD')}; each scenario shows the multiple of today&apos;s volume and of the scenario&apos;s own assumed volume. <Link href="/methodology#calculator" className="text-mint">Try your own assumptions →</Link></p>
                  <ScenarioTable todayVolume={item('INT-VOL-ANN')?.value ?? null} scenarios={preview.scenarios.map((s) => ({ key: s.key, label: s.label, inputs: { rationale: s.rationale }, outputs: s.outputs as unknown as Record<string, unknown> }))} />
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-2"><span className="text-fg">Supply parity, for comparison:</span> for buyback-designated revenue to match the dollar value of realized net new supply, Intents would need {formatValue(t.supply.parityVolumeUsd, 'USD')} of annual volume, {formatValue(t.supply.parityMultiple, 'ratio')} today&apos;s run rate. Even then total supply keeps growing, because bought tokens are held, not burned.</p>
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
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-fg-2">Sections 1 and 3 decide the verdict. A full &quot;Building the future&quot; verdict requires both lasting products (Section 1) and value returning to the token (Section 3); lasting products alone give &quot;Technology is building; the investment case is unproven&quot;. Section 2 only raises or lowers confidence. If either core section lacks data, the verdict is &quot;insufficient evidence&quot; rather than a guess. The rules and thresholds are published in the methodology. They were written while the pipeline was built, after some data had been seen, so they are not a blind pre-registration; anyone can change them and rebuild.</p>
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
