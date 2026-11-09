import Link from 'next/link';
import { HeroDebate } from '@/components/hero-debate';
import { CheckpointTable, ImpliedMatrix, LadderGrid, PlatformNeeds, ValuationRegimes } from '@/components/ladder';
import { LadderExplorer } from '@/components/ladder-explorer';
import { LibraryRow } from '@/components/library-row';
import { AsOfLine, EraTable, EventTable, SectionHeader, SupplyStats, TriggerTable } from '@/components/thesis';
import { Container, EmptyState, Notice } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { listLibrary, loadDebateView } from '@/lib/debate/view';
import { formatDate, formatValue } from '@/lib/format';
import { DEX_GROWTH } from '@/lib/research/ladder';
import { THESIS_ATTRIBUTION, THESIS_LEDE, THESIS_SUBTITLE, THESIS_TITLE } from '@/lib/research/thesis';
import { evaluateTriggers } from '@/lib/research/triggers';
import { THESIS_TOPIC } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

const link = 'text-fg underline decoration-line-strong underline-offset-2 hover:decoration-mint';

export default async function ThesisPage() {
  const [preview, episodes] = await Promise.all([
    previewTopic(THESIS_TOPIC.slug, { offline: true }).catch(() => null),
    listLibrary({ limit: 6 }).catch(() => null),
  ]);
  const latest = episodes?.entries[0] ? await loadDebateView(episodes.entries[0].id).catch(() => null) : null;
  const t = preview?.thesis ?? null;
  const l = preview?.ladder ?? null;
  const triggers = preview ? evaluateTriggers(preview.items) : [];
  const item = (id: string) => preview?.items.find((i) => i.evidenceId === id) ?? null;
  const r100 = l?.rungs.find((r) => r.price === 100) ?? null;
  const peerCap = (label: string) => l?.peers.find((p) => p.label === label)?.marketCap ?? null;
  const today = (p: number) => l?.rungs.find((r) => r.price === p)?.byMultiple.find((b) => b.multipleKey === 'today') ?? null;

  return (
    <>
      <HeroDebate
        episode={latest && latest.status === 'COMPLETE' ? latest : null}
        title={THESIS_TITLE}
        subtitle={THESIS_SUBTITLE}
        attribution={THESIS_ATTRIBUTION}
        lede={THESIS_LEDE}
        asOf={preview?.windowEnd ? formatDate(preview.windowEnd) : null}
      />

      <Container className="py-10 md:py-14">
        {preview && <AsOfLine newest={preview.newestSourceAt} windowEnd={preview.windowEnd} />}

        {!preview || !t || !l || !r100 ? (
          <div className="mt-14"><Notice tone="warn" title="Research data is not available yet.">No stored source responses were found. Run the research refresh (npm run refresh:now) or wait for the daily refresh.</Notice></div>
        ) : (
          <>
            <section aria-labelledby="intro-h" className="mt-8">
              <h2 id="intro-h" className="sr-only">What this is</h2>
              <p className="max-w-3xl text-lg leading-relaxed text-fg md:text-xl">NEAR is a blockchain whose fastest-growing product, NEAR Intents, lets people swap assets across different blockchains in one step. Part of every swap fee is used to buy back $NEAR. &quot;Three digits, minimum&quot; is a bold claim. Instead of predicting a price, we built a ladder: what NEAR would have to achieve for $10, $25, $50 and $100 in ten years, and how much of that the evidence shows today.</p>
            </section>

            {/* 01 · The dream */}
            <section id="dream" className="mt-14 scroll-mt-20">
              <SectionHeader n={1} title="The dream" question="What would $100 actually mean?" reason="Ten years from now, with more NEAR in circulation than today." howHref="/methodology#ladder" />
              <dl className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Price multiple', formatValue(r100.priceMultiple, 'ratio'), `From ${formatValue(l.inputs.price, 'USD')} today`],
                  ['Market cap at $100', formatValue(r100.marketCap, 'USD'), `Current 2.5% issuance; ${formatValue(r100.marketCapHsp029, 'USD')} if HSP-029 takes effect`],
                  ['Rank among crypto assets', `#${r100.rankToday}`, 'Against today\'s market, stablecoins excluded'],
                  ['Share of all crypto today', formatValue(r100.shareOfCryptoToday, 'fraction'), `NEAR today: ${formatValue(l.inputs.marketCap !== null && l.inputs.totalCryptoCap ? l.inputs.marketCap / l.inputs.totalCryptoCap : null, 'fraction')}`],
                ].map(([k, v, note]) => (
                  <div key={k} className="bg-surface p-5">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="num mt-2 text-3xl text-fg">{v}</dd>
                    <dd className="mt-1 text-xs leading-snug text-muted">{note}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-2">At $100, NEAR would be worth {formatValue(r100.marketCap !== null && peerCap('Solana') ? r100.marketCap / peerCap('Solana')! : null, 'ratio')} Solana and {formatValue(r100.marketCap !== null && peerCap('Ethereum') ? r100.marketCap / peerCap('Ethereum')! : null, 'ratio')} Ethereum at today&apos;s prices. It is not a bigger pump; it is a different rank in crypto.</p>
            </section>

            {/* 02 · The ladder */}
            <section id="ladder" className="mt-16 scroll-mt-20">
              <SectionHeader n={2} title="The ladder" question="How far can NEAR go, and what does each step take?" reason={l.headline} howHref="/methodology#ladder" />
              <LadderExplorer ladder={l} />
              <h3 className="mb-3 mt-8 text-lg font-[600]">The whole ladder: share of all DEX volume NEAR Intents would need in 2036</h3>
              <LadderGrid ladder={l} />
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">Each cell: the share of the 2036 DEX market (today&apos;s {formatValue(l.inputs.dex365, 'USD')} a year, grown {DEX_GROWTH.base * 100}% a year, an assumption) that Intents would need at today&apos;s take rate of {formatValue(l.inputs.takeRate, 'fraction')} of volume. Intents handles {formatValue(l.inputs.dexShareToday, 'fraction')} today. Valuation multiples are today&apos;s market cap divided by the revenue reaching holders over the last year, applied to NEAR in 2036 as assumptions, not forecasts. The &quot;Solana&quot; column shows how little revenue matters if NEAR earned a platform premium, and what that premium requires is shown in section 04.</p>
            </section>

            {/* 03 · Where scenarios land */}
            <section id="scenarios" className="mt-16 scroll-mt-20">
              <SectionHeader n={3} title="Where scenarios land" question="Turn it around: where does each future put the price?" reason={`Base growth at today's premium lands near ${formatValue(l.implied.find((g) => g.growthKey === 'base')?.byMultiple.find((b) => b.multipleKey === 'today')?.price ?? null, 'USD')}; slow growth priced on cash flow lands below today's price. ${l.swing.dominant === 'growth' ? 'Growth moves the outcome more than valuation does' : 'Valuation moves the outcome more than growth does'} (${formatValue(l.swing.acrossGrowth, 'ratio')} spread across growth scenarios, ${formatValue(l.swing.acrossMultiples, 'ratio')} across cash-flow and today's multiples).`} howHref="/methodology#ladder" />
              <ImpliedMatrix ladder={l} />
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">Implied 2036 price = Intents volume grown from today&apos;s {formatValue(l.inputs.intentsRunRate, 'USD')} run rate × take rate × valuation multiple ÷ 2036 supply. Green reaches three digits; red is below today&apos;s price. Growth rates are scenarios. Nothing here is a forecast.</p>
            </section>

            {/* 04 · The evidence */}
            <section id="evidence" className="mt-16 scroll-mt-20">
              <SectionHeader n={4} title="The evidence" question="What does today's data actually show?" howHref="/research" />

              <h3 className="mb-1 text-lg font-[600]">How the market values crypto assets</h3>
              <p className="mb-4 max-w-3xl text-sm text-muted">The largest platforms are not priced on revenue at all. Cash-flow tokens are priced on what they pay holders. A three-digit NEAR has to come from one of the two.</p>
              <ValuationRegimes ladder={l} />

              <h3 className="mb-1 mt-10 text-lg font-[600]">Is NEAR Intents on the path?</h3>
              <dl className="mb-4 mt-3 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line sm:grid-cols-3">
                {[
                  ['Annual volume (90-day run rate)', formatValue(l.inputs.intentsRunRate, 'USD'), `Last 365 days: ${formatValue(l.inputs.intents365, 'USD')}`],
                  ['Growth, year over year', formatValue(l.inputs.intentsYoY, 'fraction'), `Latest 30 days. $25 at today's premium needs ${formatValue(today(25)?.requiredCagr ?? null, 'fraction')} a year; $100 needs ${formatValue(today(100)?.requiredCagr ?? null, 'fraction')}`],
                  ['Share of all DEX volume', formatValue(l.inputs.dexShareToday, 'fraction'), `DEX market: ${formatValue(l.inputs.dex365, 'USD')} a year; it grew ${formatValue(l.inputs.dexCagr2021to2025, 'fraction')} a year from 2021 to 2025`],
                ].map(([k, v, note]) => (
                  <div key={k} className="bg-surface p-5"><dt className="text-xs text-muted">{k}</dt><dd className="num mt-2 text-2xl text-fg">{v}</dd><dd className="mt-1 text-xs leading-snug text-muted">{note}</dd></div>
                ))}
              </dl>
              <p className="mb-3 max-w-3xl text-sm text-fg-2">Checkpoints: the annual volume Intents would need each year, at today&apos;s valuation premium, to stay on each rung&apos;s path. Investors can check these every year.</p>
              <CheckpointTable ladder={l} />

              <h3 className="mb-1 mt-10 text-lg font-[600]">Could NEAR earn a platform premium instead?</h3>
              <p className="mb-4 max-w-3xl text-sm text-muted">Platforms are valued relative to the money that lives on them. For a $100 NEAR to look like these chains, this much would need to live on NEAR:</p>
              <PlatformNeeds ladder={l} />

              <h3 className="mb-1 mt-10 text-lg font-[600]">Does the token capture value today?</h3>
              <p className="mb-4 max-w-3xl text-sm text-muted">{t.sections[2]!.reason}</p>
              <SupplyStats s={t.supply} />
              <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted">A buyback is not a burn: bought tokens are held at the buyback wallet. Revenue figures are DefiLlama&apos;s buyback designation; as an onchain cross-check, the wallet holds {formatValue(t.supply.walletNear, 'NEAR')}, {formatValue(t.supply.walletVsDesignated, 'fraction')} of the {formatValue(t.supply.designatedSinceStartUsd, 'USD')} designated since {t.supply.designatedStart ?? 'n/a'}. For buyback revenue to match the value of new supply, Intents would need {formatValue(t.supply.parityVolumeUsd, 'USD')} a year ({formatValue(t.supply.parityMultiple, 'ratio')} today).</p>

              <details className="panel mt-10 p-5">
                <summary className="cursor-pointer text-lg font-[600]">Track record: did NEAR&apos;s earlier pivots last?</summary>
                <p className="mt-3 max-w-3xl text-sm text-muted">{t.sections[0]!.reason} {t.sections[1]!.reason} Exact data only: NearBlocks estimates are excluded, and Intents is measured by DefiLlama volume.</p>
                <div className="mt-4"><EraTable eras={t.eras} /></div>
                <div className="mt-4"><EventTable events={t.events} /></div>
              </details>
            </section>

            {/* 05 · What could break it */}
            <section id="risks" className="mt-16 scroll-mt-20">
              <SectionHeader n={5} title="What could break it" question="What would make every rung harder?" howHref="/methodology#ladder" />
              <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-raised text-xs text-muted"><tr><th className="px-4 py-2.5 font-normal">Risk</th><th className="px-4 py-2.5 font-normal">Effect on the ladder</th><th className="px-4 py-2.5 font-normal">Reading today</th></tr></thead>
                  <tbody>
                    {[
                      ['Intents growth slows', 'Every rung depends on compounding volume for ten years', `${formatValue(l.inputs.intentsYoY, 'fraction')} YoY; $100 path needs ${formatValue(today(100)?.requiredCagr ?? null, 'fraction')} a year`],
                      ['Fee competition', 'Halving the take rate doubles every volume requirement', `${formatValue(t.supply.takeRate, 'fraction')}, prior 90 days ${formatValue(t.supply.takeRatePrior, 'fraction')}`],
                      ['The market prices NEAR on cash flow', 'At Tron\'s multiple every rung is about 2.4x harder', `Today ${formatValue(l.multiples.find((m) => m.key === 'today')?.value ?? null, 'ratio')}`],
                      ['Supply keeps growing at 2.5%', '$100 means a larger market cap', 'HSP-029 approved, pending validator adoption'],
                      ['Value keeps leaving the NEAR chain', 'Rules out the platform-premium route', `Active accounts ${formatValue(item('ACT-DAA-YOY')?.value ?? null, 'fraction', { signed: true })} YoY; stablecoins on NEAR ${formatValue(l.platform.find((p) => p.chain === 'Near')?.stablecoins ?? null, 'USD')}`],
                    ].map(([a, b, c]) => <tr key={a} className="border-t hairline"><th scope="row" className="px-4 py-3 font-[560]">{a}</th><td className="px-4 py-3 text-fg-2">{b}</td><td className="num px-4 py-3 text-xs text-muted">{c}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <aside className="panel mt-4 p-5" aria-labelledby="exploit-h">
                <p className="eyebrow">Execution risk · reported, not scored</p>
                <h3 id="exploit-h" className="mt-2 text-lg font-[600]">NEAR Intents exploit, 1 October 2026</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">NEAR Intents paused deposits and withdrawals on 11 networks after an exploit of about $3.8M, caused by a flaw in how its Omni deposit and withdrawal service interacted with the Intents contract; the flaw was reported as patched. The team pledged full compensation; recovery has not been independently confirmed. Trust is the product for a settlement layer. <a href="https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404" target="_blank" rel="noopener noreferrer" className={link}>The Block</a> · <a href="https://en.coinotag.com/near-intents-exploit-climbs-to-3-8m-pausing-near-cross-chain-swaps" target="_blank" rel="noopener noreferrer" className={link}>recovery status</a></p>
              </aside>
            </section>

            {/* Verdict */}
            <section id="verdict" className="mt-16 scroll-mt-20" aria-labelledby="verdict-h">
              <header className="mb-6 border-t hairline pt-10">
                <p className="eyebrow mb-3"><span className="text-mint">06</span> · The verdict</p>
                <h2 id="verdict-h" className="display-l text-balance">Dream, possibility, or evidence?</h2>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-fg">{l.headline}</p>
                <p className="mt-2 text-sm text-muted">Computed from the data as of {formatDate(preview.windowEnd)}. No AI writes this verdict.</p>
              </header>
              <div className="grid gap-3 md:grid-cols-4">
                {l.rungs.map((r) => {
                  const b = r.byMultiple.find((x) => x.multipleKey === 'today')!;
                  const tone = b.band === 'holds' ? 'border-mint/50' : b.band === 'gains' ? 'border-line-strong' : b.band === 'dominant' ? 'border-amber/50' : 'border-coral/50';
                  return (
                    <div key={r.price} className={`panel border p-5 ${tone}`}>
                      <p className="num text-2xl font-[640]">${r.price}</p>
                      <p className="num text-xs text-muted">{formatValue(r.priceMultiple, 'ratio')} · rank #{r.rankToday}</p>
                      <p className="mt-3 text-sm text-fg-2">Intents needs <span className="num text-fg">{formatValue(b.dexShare2036, 'fraction')}</span> of DEX volume, growing <span className="num text-fg">{formatValue(b.requiredCagr, 'fraction')}</span> a year, and the market keeps today&apos;s premium.</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="panel p-5"><p className="eyebrow text-mint">What we know</p><p className="mt-2 text-sm leading-relaxed text-fg-2">Intents is real and growing ({formatValue(l.inputs.intentsYoY, 'fraction')} YoY, {formatValue(l.inputs.dexShareToday, 'fraction')} of DEX volume) and already pays the token {formatValue(l.inputs.captureToday, 'USD')} a year. NEAR is valued at {formatValue(l.multiples.find((m) => m.key === 'today')?.value ?? null, 'ratio')} that revenue.</p></div>
                <div className="panel p-5"><p className="eyebrow text-amber">What we assume</p><p className="mt-2 text-sm leading-relaxed text-fg-2">How the market will value NEAR in 2036, how fast the DEX market grows ({DEX_GROWTH.base * 100}% a year in the base case), and that the take rate and supply rules hold.</p></div>
                <div className="panel p-5"><p className="eyebrow text-coral">What would change the view</p><p className="mt-2 text-sm leading-relaxed text-fg-2">Intents falling behind its checkpoints, fee compression, a re-rating toward cash-flow multiples, or, upward, money and users settling on NEAR itself, which would open the platform-premium route.</p></div>
              </div>
              <details className="mt-8">
                <summary className="cursor-pointer text-sm text-muted hover:text-fg">Falsification triggers from the underlying research</summary>
                <div className="mt-3"><TriggerTable triggers={triggers} /></div>
              </details>
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
              <Link href="/methodology" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Methodology</p><p className="mt-2 font-[600]">Ladder formulas, rules, calculator and known limitations</p></Link>
            </nav>
          </>
        )}
      </Container>
    </>
  );
}
