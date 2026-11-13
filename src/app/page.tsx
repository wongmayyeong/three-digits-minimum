import Link from 'next/link';
import { DebateBand } from '@/components/debate-band';
import { HeroIntro } from '@/components/hero-intro';
import { ImpliedMatrix, LadderGrid } from '@/components/ladder';
import { LadderExplorer } from '@/components/ladder-explorer';
import { AsOfLine, SectionHeader } from '@/components/thesis';
import { Container, Notice } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { listLibrary, loadDebateView } from '@/lib/debate/view';
import { formatDate, formatValue } from '@/lib/format';
import { THESIS_ATTRIBUTION, THESIS_LEDE, THESIS_SUBTITLE, THESIS_TITLE } from '@/lib/research/thesis';
import { INVESTMENT_VERDICT, VERDICT_REVIEW } from '@/lib/research/verdict';
import { THESIS_TOPIC } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

const link = 'text-fg underline decoration-line-strong underline-offset-2 hover:decoration-mint';
const OUTCOME: Record<string, string> = { SUPPORTED: 'border-mint/60 text-mint', 'NOT SUPPORTED': 'border-coral/60 text-coral', MIXED: 'border-amber/60 text-amber', UNTESTED: 'border-line-strong text-muted' };

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-surface p-5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-2 text-3xl text-fg">{value}</dd>
      <dd className="mt-1 text-xs leading-snug text-muted">{note}</dd>
    </div>
  );
}

function Finding({ title, lines, href, note }: { title: string; lines: [string, string][]; href: string; note?: string }) {
  return (
    <article className="panel flex flex-col p-5">
      <h3 className="font-[620]">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {lines.map(([k, v]) => <div key={k} className="flex items-baseline justify-between gap-4 border-t hairline pt-2"><dt className="text-fg-2">{k}</dt><dd className="num shrink-0 text-right text-fg">{v}</dd></div>)}
      </dl>
      {note && <p className="mt-3 text-xs leading-relaxed text-muted">{note}</p>}
      <Link href={href} className="mt-auto pt-4 text-xs text-muted hover:text-fg">How this is measured →</Link>
    </article>
  );
}

export default async function ThesisPage() {
  const [preview, episodes] = await Promise.all([
    previewTopic(THESIS_TOPIC.slug, { offline: true }).catch(() => null),
    listLibrary({ limit: 6 }).catch(() => null),
  ]);
  const done = episodes?.entries.find((e) => e.status === 'COMPLETE');
  const latest = done ? await loadDebateView(done.id).catch(() => null) : null;
  const l = preview?.ladder ?? null;
  const r100 = l?.rungs.find((r) => r.price === 100) ?? null;
  const tk = preview?.tokenomics ?? null, cc = preview?.crossChain ?? null, ec = preview?.economy ?? null, va = preview?.valuation ?? null, hy = preview?.hypotheses ?? null, vd = preview?.verdict ?? null;
  const mToday = l?.multiples.find((m) => m.key === 'today')?.value ?? null;
  const need100 = va?.multipleNeeded.find((m) => m.price === 100)?.byGrowth ?? [];
  const delivered = preview?.basis.find((b) => b.basis === 'delivered') ?? null;
  const req7 = (label: string) => va?.opportunity.find((o) => o.label === label)?.targets.find((t) => t.k === 7)?.requiredCagr ?? null;
  const nearRisk = va?.opportunity.find((o) => o.label === 'NEAR')?.risk ?? null;
  const mid = l?.implied.find((g) => g.growthKey === 'base') ?? null;
  const midAt = (key: string) => mid?.byMultiple.find((b) => b.multipleKey === key)?.price ?? null;
  const delivAt = (key: string) => delivered?.impliedBase.find((b) => b.multipleKey === key)?.price ?? null;
  const reviewStale = !!preview?.windowEnd && preview.windowEnd > VERDICT_REVIEW.windowEnd;

  return (
    <>
      <HeroIntro title={THESIS_TITLE} subtitle={THESIS_SUBTITLE} asOf={preview?.windowEnd ? formatDate(preview.windowEnd) : null} />

      {/* Context: the claim being tested, moved out of the hero so the hero stays clean. */}
      <Container className="pt-16 md:pt-24">
        <section aria-labelledby="claim-h" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="eyebrow mb-4">The claim</p>
            <blockquote id="claim-h" className="display-m text-balance text-fg">&ldquo;Three digits, minimum.&rdquo;</blockquote>
            <p className="mt-4 text-sm italic text-muted">{THESIS_ATTRIBUTION}</p>
          </div>
          <div className="prose-read">
            <p>{THESIS_LEDE}</p>
            <p>NEAR is a blockchain whose fastest-growing product, NEAR Intents, lets people swap assets across different blockchains in one step. Most of the fees and value capture we can measure on NEAR come from that one product today.</p>
          </div>
        </section>
        {preview && <div className="mt-12"><AsOfLine newest={preview.newestSourceAt} windowEnd={preview.windowEnd} /></div>}

        {!preview || !l || !r100 || !tk || !cc || !ec || !va || !hy || !vd ? (
          <div className="mt-14"><Notice tone="warn" title="Research data is not available yet.">No stored source responses were found. Run the research refresh (npm run research:refresh) and load the data into the database.</Notice></div>
        ) : (
            <section id="answer" className="section-gap scroll-mt-20" aria-labelledby="answer-h">
              <p className="eyebrow mb-3"><span className="text-mint">01</span> · The answer</p>
              <h2 id="answer-h" className="display-l max-w-4xl text-balance">Interesting, but highly conditional: not a proven path to $100.</h2>
              <div className="prose-read mt-6">
                {INVESTMENT_VERDICT.map((p) => <p key={p}>{p}</p>)}
              </div>
              <p className={`mt-4 text-xs ${reviewStale ? 'text-amber' : 'text-muted'}`}>
                Verdict written by the author and last reviewed {formatDate(VERDICT_REVIEW.reviewedOn)} against data to {formatDate(VERDICT_REVIEW.windowEnd)}.
                {reviewStale ? ` The data now runs to ${formatDate(preview!.windowEnd!)}, so this prose is due for review; the numbers below are current.` : ' Every number below is recomputed from the stored data.'}
              </p>
              <dl className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Measured fees: one product" value={formatValue(ec.intentsFeeShare, 'fraction')} note="of the fees DefiLlama attributes to the NEAR chain come from NEAR Intents (cross-chain swaps, not L1 gas)" />
                <Stat label="Valued far above that product" value={formatValue(cc.nearCapToIntentsRevenue, 'ratio')} note={`NEAR market cap / Intents revenue; small cross-chain peer tokens trade at ${cc.peerRange ? `${formatValue(cc.peerRange[0], 'ratio')} to ${formatValue(cc.peerRange[1], 'ratio')}` : 'n/a'}, though NEAR's cap also prices the L1 and its other products`} />
                <Stat label="Buybacks, checked onchain" value={formatValue(tk.buybacks.deliveredAllToDesignated, 'fraction')} note="of the revenue DefiLlama labels as buybacks reached the buyback wallet" />
                <Stat label="What $100 needs" value={formatValue(need100.find((g) => g.growthKey === 'base')?.multiple ?? null, 'ratio')} note={`cash-flow multiple at 20% a year Intents growth for ten years (${formatValue(need100.find((g) => g.growthKey === 'high')?.multiple ?? null, 'ratio')} at 40%); NEAR is at ${formatValue(mToday, 'ratio')} today, which is current pricing, not a fair value`} />
              </dl>

              <h3 className="mb-3 mt-12 text-lg font-[600]">The investment case in four questions</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <article className="panel p-5">
                  <p className="eyebrow">What today&apos;s price asks you to believe</p>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">At {formatValue(l.inputs.price, 'USD')}, NEAR&apos;s market cap is {formatValue(mToday, 'ratio')} the value DefiLlama attributes to holders a year ({formatValue(delivered?.multipleToday ?? null, 'ratio')} on NEAR actually delivered to the buyback wallet). Paying that means expecting holder value to grow far faster than supply, which rises {formatValue(tk.supply.netIssuance, 'fraction')} a year net of burns, or the market to keep pricing NEAR well above its measurable cash flows.</p>
                </article>
                <article className="panel p-5">
                  <p className="eyebrow text-mint">Strongest reason it could outperform</p>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">NEAR Intents is growing fast and its revenue is real and checkable: volume is up {formatValue(ec.intentsVolumeYoY, 'fraction', { signed: true })} year over year on matched 90-day windows ({formatValue(l.inputs.intentsYoY, 'fraction', { signed: true })} on the latest 30 days), our onchain rebuild matches {formatValue(tk.buybacks.reproductionRatio, 'fraction')} of the revenue DefiLlama reports, and NEAR is reaching the buyback wallet. If growth persists and fees hold, value to holders compounds faster than dilution.</p>
                </article>
                <article className="panel p-5">
                  <p className="eyebrow text-coral">Strongest reason it could fail</p>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">One product carries the case ({formatValue(ec.intentsFeeShare, 'fraction')} of measured fees). NEAR keeps {l.inputs.holderTakeRate !== null ? `${(l.inputs.holderTakeRate * 100).toFixed(3)}%` : 'N/A'} of volume for buybacks; fee competition that halves it doubles every volume requirement. Priced like Tron rather than at its own multiple, 20% a year growth implies {formatValue(midAt('tron'), 'USD')} in 2036, and governance can change how much revenue goes to buybacks.</p>
                </article>
                <article className="panel p-5">
                  <p className="eyebrow text-amber">Still unresolved</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-fg-2">
                    <li>How concentrated Intents volume is among integrators and solvers, and how much is organic: partner data was not available, so no moat is claimed.</li>
                    <li>Whether the gap between designated and delivered buybacks closes, and whether governance keeps the allocation.</li>
                    <li>What NEAR AI and Chain Signatures add on their own: not measurable yet, which is not the same as zero.</li>
                    <li>Relay, a large rival, publishes no volume, so the size of the whole cross-chain market is unknown.</li>
                  </ul>
                </article>
              </div>
            </section>
        )}
      </Container>

      <DebateBand episode={latest && latest.status === 'COMPLETE' ? latest : null} />

      <Container className="pb-10 md:pb-14">
        {preview && l && r100 && tk && cc && ec && va && hy && vd && (
          <>
            {/* 02 · The ladder */}
            <section id="ladder" className="section-gap scroll-mt-20">
              <SectionHeader n={2} title="The ladder" question="What would $10, $25, $50 and $100 in ten years take?" reason={l.headline} howHref="/methodology#ladder" />
              <LadderExplorer ladder={l} />
              <h3 className="mb-3 mt-8 text-lg font-[600]">The whole ladder: Intents volume needed in 2036, relative to spot DEX volume</h3>
              <LadderGrid ladder={l} />
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">At $100, NEAR&apos;s market cap would be {formatValue(r100.marketCap, 'USD')}, rank #{r100.rankToday} in crypto today. Multiples use DefiLlama&apos;s designated buybacks; on NEAR delivered to the buyback wallet, NEAR&apos;s own multiple is {formatValue(delivered?.multipleToday ?? null, 'ratio')} and every rung priced like a cash-flow token needs about half as much volume again. Intents volume relative to spot DEX volume is a scale comparison, not a market share or a ceiling. Scenarios, not forecasts.</p>

              <h3 className="mb-1 mt-10 text-lg font-[600]">The other direction: what growth and a multiple imply</h3>
              <p className="mb-3 max-w-3xl text-sm leading-relaxed text-muted">If Intents grows at this rate for ten years, and the market applies this multiple, what price does the model imply in 2036? Today: {formatValue(l.inputs.price, 'USD')}.</p>
              <ImpliedMatrix ladder={l} />
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">
                Illustrative scenarios, not forecasts or probabilities; &ldquo;middle&rdquo; is the middle of three assumptions, not an expected outcome. Prices only: staking rewards, fees and taxes are left out.
                {' '}On NEAR delivered to the buyback wallet instead of designated buybacks, the 20% row becomes {formatValue(delivAt('hyperliquid'), 'USD')} / {formatValue(delivAt('tron'), 'USD')} / {formatValue(delivAt('today'), 'USD')}.
                {' '}At NEAR&apos;s own multiple the two bases nearly agree, because holding today&apos;s multiple fixed makes the answer mostly Intents growth adjusted for supply growth; the basis matters once NEAR is priced like another token. Hyperliquid and Tron are reference scenarios, not equivalent businesses.
              </p>
            </section>

            {/* 03 · What the evidence shows */}
            <section id="evidence" className="section-gap scroll-mt-20">
              <SectionHeader n={3} title="What the evidence shows" question="Six findings from public data, cross-checked against a second source where one exists" howHref="/research" />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Finding title="Measured fees concentrate in NEAR Intents" href="/methodology#economy" note="Chain Signatures underpins Intents' cross-chain withdrawals, so part of its value is already inside the Intents numbers and is not counted twice." lines={[
                  ['Intents share of fees attributed to NEAR', formatValue(ec.intentsFeeShare, 'fraction')],
                  ['Intents volume, year over year', formatValue(ec.intentsVolumeYoY, 'fraction', { signed: true })],
                  ['NEAR L1 transactions, year over year', formatValue(ec.l1.txnsYoY, 'fraction', { signed: true })],
                  ['NEAR AI, Chain Signatures: standalone value to $NEAR', 'not measurable yet'],
                ]} />
                <Finding title="Where the buybacks went" href="/methodology#tokenomics" note="Designated is a classification; delivered is an observed transfer, valued at market prices, not verified purchase prices. Held tokens are not burned." lines={[
                  ['Designated as buybacks (DefiLlama)', formatValue(tk.buybacks.designatedUsd, 'USD')],
                  ['Reached the buyback wallet', formatValue(tk.buybacks.deliveredAllToDesignated, 'fraction')],
                  ['Kept in the front-end fund', formatValue(tk.buybacks.frontendUsd, 'USD')],
                  ['From accounts other than Intents', formatValue(tk.buybacks.nonIntentsUsd, 'USD')],
                ]} />
                <Finding title="Supply keeps growing" href="/methodology#tokenomics" lines={[
                  ['Net issuance, share of supply a year', formatValue(tk.supply.netIssuance, 'fraction')],
                  ['Absorbed into the held buyback wallet', formatValue(tk.supply.buybackAbsorption, 'fraction')],
                  ['Staked', formatValue(tk.staking.stakingRatio, 'fraction')],
                  ['Non-staker share of supply, per year', formatValue(tk.staking.realYieldNonStaker, 'fraction', { signed: true })],
                ]} />
                <Finding title="Leads the cross-chain venues we can measure" href="/methodology#competition" note="Only venues that publish volume are compared; Relay does not, so this is not the size of the whole market." lines={[
                  [`Share of ${cc.swapVenues.length} cross-chain venues with public volume`, formatValue(cc.swapVenueShare, 'fraction')],
                  ['Intents revenue a year', formatValue(cc.rows.find((r) => r.name === 'NEAR Intents')?.revenueRunRate ?? null, 'USD')],
                  ['Relay revenue a year (no public volume)', formatValue(cc.rows.find((r) => r.name === 'Relay')?.revenueRunRate ?? null, 'USD')],
                  ['Cross-chain peer tokens, market cap / revenue', cc.peerRange ? `${formatValue(cc.peerRange[0], 'ratio')} to ${formatValue(cc.peerRange[1], 'ratio')}` : 'n/a'],
                ]} />
                <Finding title="Against the alternatives" href="/methodology#valuation" note="A mechanical comparison with each token's valuation ratio held fixed, not a measure of which is more likely to deliver." lines={[
                  ['Driver growth for 7x in ten years: NEAR', formatValue(req7('NEAR'), 'fraction')],
                  ['ETH / SOL / HYPE (same model)', `${formatValue(req7('ETH'), 'fraction')} / ${formatValue(req7('SOL'), 'fraction')} / ${formatValue(req7('HYPE'), 'fraction')}`],
                  ['NEAR volatility, last year', formatValue(nearRisk?.vol1y ?? null, 'fraction')],
                  ['NEAR max drawdown, three years', formatValue(nearRisk?.maxDrawdown3y ?? null, 'fraction')],
                ]} />
                <Finding title="Platform route not yet visible" href="/methodology#ladder" lines={[
                  ['Stablecoins on NEAR', formatValue(l.platform.find((p) => p.chain === 'Near')?.stablecoins ?? null, 'USD')],
                  ['Stablecoins $100 needs at Solana\'s ratio', formatValue(r100.platform.find((p) => p.benchmark === 'Solana')?.stablecoins ?? null, 'USD')],
                  ['DeFi TVL on NEAR', formatValue(l.platform.find((p) => p.chain === 'Near')?.tvl ?? null, 'USD')],
                  ['DeFi TVL $100 needs at Solana\'s ratio', formatValue(r100.platform.find((p) => p.benchmark === 'Solana')?.tvl ?? null, 'USD')],
                ]} />
              </div>
            </section>

            {/* 04 · Verdict lines */}
            <section id="verdict" className="section-gap scroll-mt-20">
              <SectionHeader n={4} title="Leads and trails" question="Where does NEAR lead, and where does it trail?" reason={`${vd.summary} Every line is generated by a rule from the data.`} howHref="/methodology#verdict" />
              <div className="grid gap-3 md:grid-cols-3">
                {([['Leads', vd.leads, 'text-mint'], ['Trails', vd.trails, 'text-coral'], ['Neither, by itself', vd.traits, 'text-amber']] as const).map(([t, items, cls]) => (
                  <div key={t} className="panel p-5"><p className={`eyebrow ${cls}`}>{t}</p><ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-2">{items.map((x) => <li key={x}>{x}</li>)}</ul></div>
                ))}
              </div>
            </section>

            {/* 05 · Hypotheses */}
            <section id="hypotheses" className="section-gap scroll-mt-20">
              <SectionHeader n={5} title="Ten hypotheses, tested" question="Written before the data was read, decided by published rules" howHref="/methodology#hypotheses" />
              <ul className="grid gap-2 md:grid-cols-2">
                {hy.results.map((h) => (
                  <li key={h.id} className="panel flex items-start gap-3 p-4 text-sm">
                    <span className="num w-9 shrink-0 text-muted">{h.id}</span>
                    <span className="flex-1 leading-snug text-fg-2">{h.claim.split(' (')[0]}</span>
                    <span className={`chip h-6 shrink-0 px-2 text-[0.6875rem] ${OUTCOME[h.outcome] ?? ''}`}>{h.outcome.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
              <aside className="panel mt-4 p-5" aria-labelledby="exploit-h">
                <p className="eyebrow">Execution risk · reported, not scored</p>
                <h3 id="exploit-h" className="mt-2 font-[600]">NEAR Intents exploit, 1 October 2026</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">About $3.8M of unbacked balances were created through a flaw in the Intents contract&apos;s deposit notification function. The attacker returned the funds on 2 October; the post-mortem reports users compensated, a second flaw fixed and the function removed. <a href="https://decrypt.co/380014/near-intents-recovers-3-8-million-after-48-hour-ultimatum" target="_blank" rel="noopener noreferrer" className={link}>Decrypt</a> · <a href="https://www.techflowpost.com/en-US/newsletter/140312" target="_blank" rel="noopener noreferrer" className={link}>post-mortem summary</a></p>
              </aside>
            </section>

            <nav aria-label="Go deeper" className="mt-16 grid gap-3 border-t hairline pt-10 md:grid-cols-3">
              <Link href="/research" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Data &amp; queries</p><p className="mt-2 font-[600]">Every chart, the request behind it, and the raw hashes</p></Link>
              <Link href="/methodology" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Methodology</p><p className="mt-2 font-[600]">Formulas, rules, the audit and known limitations</p></Link>
              <Link href="/methodology#reproduce" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Reproduce this research</p><p className="mt-2 font-[600]">The code, the raw responses and the commands to rebuild every number offline</p></Link>
            </nav>
          </>
        )}
      </Container>
    </>
  );
}
