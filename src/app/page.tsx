import Link from 'next/link';
import { DebateBand } from '@/components/debate-band';
import { HeroIntro } from '@/components/hero-intro';
import { LadderGrid } from '@/components/ladder';
import { LadderExplorer } from '@/components/ladder-explorer';
import { LibraryRow } from '@/components/library-row';
import { AsOfLine, SectionHeader } from '@/components/thesis';
import { Container, EmptyState, Notice } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { listLibrary, loadDebateView } from '@/lib/debate/view';
import { formatDate, formatValue } from '@/lib/format';
import { THESIS_ATTRIBUTION, THESIS_LEDE, THESIS_SUBTITLE, THESIS_TITLE } from '@/lib/research/thesis';
import { INVESTMENT_VERDICT } from '@/lib/research/verdict';
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

function Finding({ title, lines, href }: { title: string; lines: [string, string][]; href: string }) {
  return (
    <article className="panel flex flex-col p-5">
      <h3 className="font-[620]">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {lines.map(([k, v]) => <div key={k} className="flex items-baseline justify-between gap-4 border-t hairline pt-2"><dt className="text-fg-2">{k}</dt><dd className="num shrink-0 text-right text-fg">{v}</dd></div>)}
      </dl>
      <Link href={href} className="mt-auto pt-4 text-xs text-muted hover:text-fg">How this is measured →</Link>
    </article>
  );
}

export default async function ThesisPage() {
  const [preview, episodes] = await Promise.all([
    previewTopic(THESIS_TOPIC.slug, { offline: true }).catch(() => null),
    listLibrary({ limit: 6 }).catch(() => null),
  ]);
  const latest = episodes?.entries[0] ? await loadDebateView(episodes.entries[0].id).catch(() => null) : null;
  const l = preview?.ladder ?? null;
  const r100 = l?.rungs.find((r) => r.price === 100) ?? null;
  const tk = preview?.tokenomics ?? null, cc = preview?.crossChain ?? null, ec = preview?.economy ?? null, va = preview?.valuation ?? null, hy = preview?.hypotheses ?? null, vd = preview?.verdict ?? null;
  const mToday = l?.multiples.find((m) => m.key === 'today')?.value ?? null;
  const need100 = va?.multipleNeeded.find((m) => m.price === 100)?.byGrowth ?? [];
  const delivered = preview?.basis.find((b) => b.basis === 'delivered') ?? null;
  const req7 = (label: string) => va?.opportunity.find((o) => o.label === label)?.targets.find((t) => t.k === 7)?.requiredCagr ?? null;
  const nearRisk = va?.opportunity.find((o) => o.label === 'NEAR')?.risk ?? null;

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
            <p>NEAR is a blockchain whose fastest-growing product, NEAR Intents, lets people swap assets across different blockchains in one step. That product is where almost all of NEAR&apos;s measurable economy sits today.</p>
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
              <dl className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border hairline bg-line sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="NEAR's economy is one product" value={formatValue(ec.intentsFeeShare, 'fraction')} note="of the fees DefiLlama attributes to NEAR come from NEAR Intents (cross-chain swaps, not L1 gas)" />
                <Stat label="Valued far above that product" value={formatValue(cc.nearCapToIntentsRevenue, 'ratio')} note={`NEAR market cap / Intents revenue; small cross-chain peer tokens trade at ${cc.peerRange ? `${formatValue(cc.peerRange[0], 'ratio')} to ${formatValue(cc.peerRange[1], 'ratio')}` : 'n/a'}`} />
                <Stat label="Buybacks, checked onchain" value={formatValue(tk.buybacks.deliveredAllToDesignated, 'fraction')} note="of the revenue DefiLlama labels as buybacks reached the buyback wallet" />
                <Stat label="What $100 needs" value={formatValue(need100.find((g) => g.growthKey === 'base')?.multiple ?? null, 'ratio')} note={`cash-flow multiple at 20% a year Intents growth for ten years (${formatValue(need100.find((g) => g.growthKey === 'high')?.multiple ?? null, 'ratio')} at 40%); NEAR is at ${formatValue(mToday, 'ratio')} today`} />
              </dl>
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
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted">At $100, NEAR&apos;s market cap would be {formatValue(r100.marketCap, 'USD')}, rank #{r100.rankToday} in crypto today. Multiples use DefiLlama&apos;s designated buybacks; on NEAR delivered to the buyback wallet, NEAR&apos;s own multiple is {formatValue(delivered?.multipleToday ?? null, 'ratio')} and every rung priced like a cash-flow token needs about half as much volume again. Scenarios, not forecasts.</p>
            </section>

            {/* 03 · What the evidence shows */}
            <section id="evidence" className="section-gap scroll-mt-20">
              <SectionHeader n={3} title="What the evidence shows" question="Six findings, each checked against independent data" howHref="/research" />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Finding title="NEAR's economy is NEAR Intents" href="/methodology#economy" lines={[
                  ['Intents share of fees attributed to NEAR', formatValue(ec.intentsFeeShare, 'fraction')],
                  ['Intents volume, year over year', formatValue(ec.intentsVolumeYoY, 'fraction', { signed: true })],
                  ['NEAR L1 transactions, year over year', formatValue(ec.l1.txnsYoY, 'fraction', { signed: true })],
                  ['NEAR AI, Chain Signatures: verified value to $NEAR', 'none'],
                ]} />
                <Finding title="Where the buybacks went" href="/methodology#tokenomics" lines={[
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
                <Finding title="Leader of a small, cheaply valued market" href="/methodology#competition" lines={[
                  [`Share of ${cc.swapVenues.length} cross-chain venues with public volume`, formatValue(cc.swapVenueShare, 'fraction')],
                  ['Intents revenue a year', formatValue(cc.rows.find((r) => r.name === 'NEAR Intents')?.revenueRunRate ?? null, 'USD')],
                  ['Relay revenue a year (no public volume)', formatValue(cc.rows.find((r) => r.name === 'Relay')?.revenueRunRate ?? null, 'USD')],
                  ['Cross-chain peer tokens, market cap / revenue', cc.peerRange ? `${formatValue(cc.peerRange[0], 'ratio')} to ${formatValue(cc.peerRange[1], 'ratio')}` : 'n/a'],
                ]} />
                <Finding title="Against the alternatives" href="/methodology#valuation" lines={[
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

            <section id="episodes" className="section-gap scroll-mt-20" aria-labelledby="ep-h">
              <h2 id="ep-h" className="mb-4 border-t hairline pt-10 text-lg font-[600]">Debate episodes</h2>
              {episodes?.entries.length ? (
                <ul className="grid gap-3 md:grid-cols-2">{episodes.entries.map((e) => <LibraryRow key={e.id} e={e} />)}</ul>
              ) : (
                <EmptyState title="No debate episodes yet.">Each episode is generated from a frozen snapshot of this research and kept permanently.</EmptyState>
              )}
            </section>

            <nav aria-label="Go deeper" className="mt-16 grid gap-3 border-t hairline pt-10 md:grid-cols-2">
              <Link href="/research" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Data &amp; queries</p><p className="mt-2 font-[600]">Every chart, the request behind it, and the raw hashes</p></Link>
              <Link href="/methodology" className="panel p-5 transition-colors hover:border-line-strong"><p className="eyebrow">Methodology</p><p className="mt-2 font-[600]">Formulas, rules, the audit and known limitations</p></Link>
            </nav>
          </>
        )}
      </Container>
    </>
  );
}
