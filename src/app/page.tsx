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
              <h3 className="mb-3 mt-8 text-lg font-[600]">The whole ladder: Intents volume needed in 2036, relative to spot DEX volume</h3>
              <LadderGrid ladder={l} />
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">Each cell: the Intents volume a rung needs, as a fraction of 2036 spot DEX volume (DefiLlama&apos;s &quot;Dexs&quot; category, {formatValue(l.inputs.spotDexRunRate, 'USD')} a year today, grown {DEX_GROWTH.base * 100}% a year, an assumption). Intents equals {formatValue(l.inputs.dexShareToday, 'fraction')} of spot DEX volume today. It is a scale reference, not a market share: Intents is a cross-chain category. Multiples are market cap divided by the value reaching holders (burns and buybacks), every asset on the same {l.basis.runRateDays}-day run rate ending {formatDate(l.basis.windowEnd)}, applied to NEAR in 2036 as assumptions. Platform valuations are a separate framework (section 04), never mixed into this table.</p>
            </section>

            {/* 03 · Where scenarios land */}
            <section id="scenarios" className="mt-16 scroll-mt-20">
              <SectionHeader n={3} title="Where scenarios land" question="Turn it around: where does each future put the price?" reason={`Base growth at NEAR's own multiple lands near ${formatValue(l.implied.find((g) => g.growthKey === 'base')?.byMultiple.find((b) => b.multipleKey === 'today')?.price ?? null, 'USD')}; slow growth priced on cash flow lands below today's price. ${l.swing.sentence}`} howHref="/methodology#ladder" />
              <ImpliedMatrix ladder={l} />
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">Implied 2036 price = (Intents volume grown from today&apos;s {formatValue(l.inputs.intentsRunRate, 'USD')} run rate × buyback revenue per dollar of volume + burns at today&apos;s run rate) × valuation multiple ÷ 2036 supply. Green reaches three digits; red is below today&apos;s price. Growth rates are scenarios. Nothing here is a forecast.</p>
            </section>

            {/* 04 · The evidence */}
            <section id="evidence" className="mt-16 scroll-mt-20">
              <SectionHeader n={4} title="The evidence" question="What does today's data actually show?" howHref="/research" />

              <h3 className="mb-1 text-lg font-[600]">How the market values crypto assets</h3>
              <p className="mb-4 max-w-3xl text-sm text-muted">Every row uses the same metric, run rate and end date. Platforms trade at thousands of times what reaches holders because they are valued on their on-chain economy; cash-flow tokens are priced on what they pay holders. The two are kept in separate frameworks.</p>
              <ValuationRegimes ladder={l} />

              <h3 className="mb-1 mt-10 text-lg font-[600]">Is NEAR Intents on the path?</h3>
              <dl className="mb-4 mt-3 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line sm:grid-cols-3">
                {[
                  ['Annual volume (90-day run rate)', formatValue(l.inputs.intentsRunRate, 'USD'), `Last 365 days: ${formatValue(l.inputs.intents365, 'USD')}`],
                  ['Growth, year over year', formatValue(l.inputs.intentsYoY, 'fraction'), `Latest 30 days. $25 at NEAR's own multiple needs ${formatValue(today(25)?.requiredCagr ?? null, 'fraction')} a year; $100 needs ${formatValue(today(100)?.requiredCagr ?? null, 'fraction')}`],
                  ['Relative to spot DEX volume', formatValue(l.inputs.dexShareToday, 'fraction'), `Run rate; ${formatValue(l.inputs.dexShareToday365, 'fraction')} over the last 365 days. Spot DEX volume grew ${formatValue(l.inputs.dexCagr2021to2025, 'fraction')} a year from 2021 to 2025`],
                ].map(([k, v, note]) => (
                  <div key={k} className="bg-surface p-5"><dt className="text-xs text-muted">{k}</dt><dd className="num mt-2 text-2xl text-fg">{v}</dd><dd className="mt-1 text-xs leading-snug text-muted">{note}</dd></div>
                ))}
              </dl>
              <p className="mb-3 max-w-3xl text-sm text-fg-2">Checkpoints: the annual volume Intents would need each year, at NEAR&apos;s own multiple today, to stay on each rung&apos;s path. Investors can check these every year.</p>
              <CheckpointTable ladder={l} />

              <h3 className="mb-1 mt-10 text-lg font-[600]">Could NEAR be valued as a platform instead?</h3>
              <p className="mb-4 max-w-3xl text-sm text-muted">A separate framework, never added to the cash-flow ladder. Platforms are valued relative to the money that lives on them. For each rung to look like these chains, this much would need to live on NEAR:</p>
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
                      ['The market prices NEAR like other cash-flow tokens', `At Tron's multiple every rung needs ${formatValue((l.multiples.find((m) => m.key === 'today')?.value ?? 0) / (l.multiples.find((m) => m.key === 'tron')?.value ?? Infinity), 'ratio')} the value to holders`, `NEAR ${formatValue(l.multiples.find((m) => m.key === 'today')?.value ?? null, 'ratio')}; Tron ${formatValue(l.multiples.find((m) => m.key === 'tron')?.value ?? null, 'ratio')}; Hyperliquid ${formatValue(l.multiples.find((m) => m.key === 'hyperliquid')?.value ?? null, 'ratio')}`],
                      ['Supply keeps growing at 2.5%', '$100 means a larger market cap', 'HSP-029 approved, pending validator adoption'],
                      ['Value keeps leaving the NEAR chain', 'Rules out the platform-premium route', `Active accounts ${formatValue(item('ACT-DAA-YOY')?.value ?? null, 'fraction', { signed: true })} YoY; stablecoins on NEAR ${formatValue(l.platform.find((p) => p.chain === 'Near')?.stablecoins ?? null, 'USD')}`],
                    ].map(([a, b, c]) => <tr key={a} className="border-t hairline"><th scope="row" className="px-4 py-3 font-[560]">{a}</th><td className="px-4 py-3 text-fg-2">{b}</td><td className="num px-4 py-3 text-xs text-muted">{c}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <aside className="panel mt-4 p-5" aria-labelledby="exploit-h">
                <p className="eyebrow">Execution risk · reported, not scored</p>
                <h3 id="exploit-h" className="mt-2 text-lg font-[600]">NEAR Intents exploit, 1 October 2026</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">An attacker created about $3.8M of unbacked balances (USDT on BNB Chain) through a flaw in the Intents contract&apos;s deposit notification function, then withdrew real tokens. Intents paused within about half an hour and halted deposits and withdrawals on 11 networks. The attacker returned the funds on 2 October. The team&apos;s post-mortem (16 October) says all affected users were compensated, a second flaw in the same function was found by a white-hat on 7 October ($300,000 bounty), the function was removed, and a balance check now pauses the contract automatically. Reported by the press and the team; not independently verified onchain here. Trust is the product for a settlement layer. <a href="https://decrypt.co/380014/near-intents-recovers-3-8-million-after-48-hour-ultimatum" target="_blank" rel="noopener noreferrer" className={link}>Decrypt</a> · <a href="https://www.techflowpost.com/en-US/newsletter/140312" target="_blank" rel="noopener noreferrer" className={link}>post-mortem summary</a> · <a href="https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404" target="_blank" rel="noopener noreferrer" className={link}>The Block</a></p>
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
                      <p className="mt-3 text-sm text-fg-2">Intents volume equal to <span className="num text-fg">{formatValue(b.dexShare2036, 'fraction')}</span> of spot DEX volume, growing <span className="num text-fg">{formatValue(b.requiredCagr, 'fraction')}</span> a year, and the market keeps NEAR&apos;s multiple today.</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="panel p-5"><p className="eyebrow text-mint">What we know</p><p className="mt-2 text-sm leading-relaxed text-fg-2">Intents is real and growing ({formatValue(l.inputs.intentsYoY, 'fraction')} YoY, {formatValue(l.inputs.dexShareToday, 'fraction')} of spot DEX volume). Gas burns plus Intents revenue designated for buybacks come to {formatValue(l.inputs.captureToday, 'USD')} a year. NEAR is valued at {formatValue(l.multiples.find((m) => m.key === 'today')?.value ?? null, 'ratio')} that flow; Tron at {formatValue(l.multiples.find((m) => m.key === 'tron')?.value ?? null, 'ratio')} and Hyperliquid at {formatValue(l.multiples.find((m) => m.key === 'hyperliquid')?.value ?? null, 'ratio')} on the same basis.</p></div>
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
