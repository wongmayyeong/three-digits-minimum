import type { Metadata } from 'next';
import { Calculator } from '@/components/calculator';
import { SectionNav } from '@/components/section-nav';
import { Container, ExternalLink } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { ERA_CONTRACTS, SOURCES } from '@/lib/data/sources';
import { RULES, THESIS_VERSION } from '@/lib/research/thesis';
import { SUPPLY_JUMP, TOKENOMICS_VERSION } from '@/lib/research/tokenomics';
import { DEX_GROWTH, GROWTH_SCENARIOS, HORIZON_YEARS, LADDER_VERSION, RUNGS, SHARE_BANDS, SUPPLY_RULES, SWING_SIMILAR } from '@/lib/research/ladder';
import { formatDate, formatValue } from '@/lib/format';
import { allocationSensitivity, FORMULA_VERSION, SCENARIOS, sensitivity, type SensitivityMatrix } from '@/lib/research/model';
import { METHODOLOGY_VERSION } from '@/lib/research/evidence';
import { PROMPT_VERSION } from '@/lib/ai/prompts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Methodology and model', description: 'How the price ladder is built, how evidence snapshots are frozen, how the buyback model works, and how AI arguments are audited and scored.' };

function Matrix({ m, title }: { m: SensitivityMatrix; title: string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="px-4 pt-3 text-left text-sm font-[560] text-fg">{title}<span className="block text-xs font-normal text-muted">Cells: volume multiple of today&apos;s run rate required. Rows: {m.rowLabel.toLowerCase()}. Columns: {m.colLabel.toLowerCase()}.</span></caption>
        <thead className="text-xs text-muted">
          <tr><th scope="col" className="px-4 py-2 text-left font-normal">{m.rowLabel}</th>{m.cols.map((c) => <th key={c} scope="col" className="px-4 py-2 text-right font-normal">{formatValue(c, 'fraction')}</th>)}</tr>
        </thead>
        <tbody>
          {m.rows.map((r, i) => (
            <tr key={r} className="border-t hairline">
              <th scope="row" className="num px-4 py-2 text-left font-normal text-fg-2">{formatValue(r, 'fraction')}</th>
              {m.cells[i]!.map((v, j) => <td key={j} className={`num px-4 py-2 text-right ${v !== null && v <= 1 ? 'text-mint' : v !== null && v > 10 ? 'text-coral' : ''}`}>{formatValue(v, 'ratio')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MethodologyPage() {
  const preview = await previewTopic('building-or-hype', { offline: true }).catch(() => null);
  const base = preview?.modelBase ?? null;
  const fee = base ? sensitivity(base) : null;
  const alloc = base ? allocationSensitivity(base) : null;
  const l = preview?.ladder ?? null;

  return (
    <Container className="max-w-[1100px] py-12 md:py-16">
      <p className="eyebrow mb-3">Methodology</p>
      <h1 className="display-l text-balance">How the thesis is tested.</h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg-2">This is an educational research project. &quot;Three digits, minimum&quot; is used as a hook: instead of forecasting a price, the price ladder computes what NEAR would have to achieve for $10, $25, $50 and $100 in ten years and labels every condition as observed, assumed or unproven. Bull and Bear argue over the same frozen evidence. Nothing here forecasts prices, rates NEAR as an investment, or gives financial advice.</p>

      <SectionNav items={[['#principles', 'Principles'], ['#ladder', 'The price ladder'], ['#tokenomics', 'Token economics'], ['#economy', 'Economy map'], ['#competition', 'Competition'], ['#valuation', 'Valuation and alternatives'], ['#hypotheses', 'Hypotheses'], ['#verdict', 'Verdict and audit'], ['#thesis', 'Evidence rules'], ['#model', 'The model'], ['#calculator', 'Calculator'], ['#ai', 'AI and audit'], ['#scoring', 'Scoring'], ['#sources', 'Data sources'], ['#limits', 'Limitations']]} />

      <section id="principles" className="scroll-mt-20 border-t hairline pt-10 mt-12">
        <h2 className="display-m">Principles</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ['Every number has an address.', 'Each evidence item records its source URL, retrieval time, period, transformation and the SHA-256 of the stored provider response.'],
            ['Four labels, never mixed.', 'OBSERVED (read from a source), DERIVED (computed here from observed values), REPORTED (stated by a third party), ASSUMED (a scenario choice). Assumptions are never presented as evidence.'],
            ['Missing means missing.', 'If a source fails or needs a credential that is not configured, the item is marked unavailable with the reason. Nothing is estimated to fill the gap, and no fixture is substituted in production.'],
            ['Matched windows only.', 'Ratios combine series over identical dates from the same provider scope. Flow metrics use the 90 days ending the day before the latest complete day; peer comparisons use one shared 30-day window.'],
            ['Frozen at the start.', 'A debate snapshot is written once and never updated. Replays and reports read only that snapshot. A rematch creates a new snapshot and shows the differences.'],
            ['Code decides what is true.', 'The AI can only cite snapshot IDs. The server validates every citation and every spoken number before a turn is saved, and applies score penalties itself.'],
          ].map(([h, b]) => <li key={h} className="panel p-5"><p className="font-[600]">{h}</p><p className="mt-2 text-sm leading-relaxed text-muted">{b}</p></li>)}
        </ol>
      </section>

      <section id="ladder" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">The price ladder</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Rungs: {RUNGS.map((r) => "$" + r).join(', ')}, {HORIZON_YEARS} years from the data date. Every number is computed by deterministic code from stored responses; no AI writes any number, status or verdict. Ladder version <span className="num">{LADDER_VERSION}</span>.</p>

        <h3 className="mt-8 text-lg font-[600]">Layer A: what each rung takes</h3>
        <pre className="num mt-3 overflow-x-auto rounded-[var(--radius-md)] border hairline bg-surface p-5 text-[0.8125rem] leading-7 text-fg-2">{`supply_2036          = circulating supply grown at the issuance rule, monthly, for ${HORIZON_YEARS} years
market_cap           = rung price × supply_2036
value_needed         = market_cap ÷ cash-flow multiple        (burns + buybacks reaching holders per year)
intents_volume       = (value_needed − burns at today's run rate) ÷ buyback revenue per dollar of volume
growth_needed        = (intents_volume ÷ today's run rate)^(1/${HORIZON_YEARS}) − 1
dex_share_2036       = intents_volume ÷ (spot DEX run rate × (1 + ${DEX_GROWTH.base * 100}%)^${HORIZON_YEARS})
share_multiple       = dex_share_2036 ÷ (Intents run rate ÷ spot DEX run rate today)`}</pre>
        <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
          {[
            ['Valuation multiples (cash-flow framework)', `Market cap divided by the value reaching holders: DefiLlama holders revenue (burns and buybacks) for every asset, the same ${l?.basis.runRateDays ?? 90}-day run rate, windows ending on the same day (${l ? formatDate(l.basis.windowEnd) : 'n/a'}). Read live: ${l ? l.multiples.map((m) => `${m.label} ${formatValue(m.value, 'ratio')} (trailing year ${formatValue(m.value365, 'ratio')})`).join('; ') : 'unavailable'}. NEAR's value is gas burned plus Intents revenue designated for buybacks, the same channels that are projected forward, each with its own driver. ${l?.basis.trailingNote ?? ''} Applied to NEAR in ten years as assumptions, never forecasts.`],
            ['Supply', `${SUPPLY_RULES.cap25.label} is the base case. ${SUPPLY_RULES.hsp029.label} is shown alongside: ${SUPPLY_RULES.hsp029.note}`],
            ['Buyback revenue per dollar of volume', 'Intents revenue DefiLlama designates for buybacks divided by Intents volume over the same 90 days (LAD-HOLDER-TAKE-RATE; equal to take rate × buyback share). Held constant: fee competition is the largest single risk, since halving it doubles every volume requirement. Designated buybacks are a classification; NEAR delivered to the buyback wallet is reconstructed separately onchain.'],
            ['Spot DEX market', `DefiLlama's DEX overview mixes categories: spot DEXs, prediction markets, bridges (NEAR Intents is listed as a Bridge), launchpads and trading apps. Its per-protocol breakdown is summed per day by category and only the "Dexs" category is used: ${l ? formatValue(l.inputs.spotDexRunRate, 'USD') : 'n/a'} a year (run rate) against ${l ? formatValue(l.inputs.allDexRunRate, 'USD') : 'n/a'} for the whole overview. Grown ${DEX_GROWTH.base * 100}% a year in the base case (${DEX_GROWTH.low * 100}% as a low case); it grew ${l ? formatValue(l.inputs.dexCagr2021to2025, 'fraction') : 'n/a'} a year from 2021 to 2025. Intents' ratio to it is a scale reference, not a market share.`],
            ['Rank', 'The rung market cap against today\'s largest 40 crypto assets (CoinGecko), excluding stablecoins and wrapped or tokenized assets. It compares a future value with today\'s market, so it is a sense of scale, not a forecast rank.'],
            ['Platform framework', 'A separate framework, never added to the cash-flow ladder and never used in its tables. Platforms trade at thousands of times the value reaching holders because they are valued on the economy that lives on the chain. For every rung, the page shows the stablecoins and DeFi TVL NEAR would need at the market cap to stablecoins and market cap to TVL ratios of Ethereum, BNB Chain, Solana and Tron (DefiLlama).'],
          ].map(([k, d]) => <div key={k} className="panel p-4"><dt className="font-[600]">{k}</dt><dd className="mt-1 leading-relaxed text-fg-2">{d}</dd></div>)}
        </dl>

        <h3 className="mt-8 text-lg font-[600]">Bands: how hard each rung is</h3>
        <p className="mt-1 text-sm text-muted">Each rung and multiple is placed in a band by how many times today&apos;s ratio of Intents volume to spot DEX volume it would need in ten years.</p>
        <ul className="mt-3 grid gap-2 text-sm md:grid-cols-4">
          {SHARE_BANDS.map((b) => <li key={b.key} className="panel p-3"><span className="num text-xs text-faint">{Number.isFinite(b.max) ? `≤ ${b.max}x` : '> 10x'}</span><p className="mt-1 text-fg-2">{b.label}</p></li>)}
        </ul>

        <h3 className="mt-8 text-lg font-[600]">Layer B: what we can prove</h3>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
          <div className="panel border-mint/40 p-4"><p className="font-[600] text-mint">Observed</p><p className="mt-1 leading-relaxed text-fg-2">In today&apos;s data, with a source and a response hash: for example, gas burned and Intents revenue designated for buybacks, and Intents&apos; year-over-year growth.</p></div>
          <div className="panel border-amber/40 p-4"><p className="font-[600] text-amber">Assumed</p><p className="mt-1 leading-relaxed text-fg-2">A modelling choice we make and publish: the valuation multiple in ten years, the DEX market&apos;s growth, the take rate and the supply rule.</p></div>
          <div className="panel border-coral/40 p-4"><p className="font-[600] text-coral">Unproven</p><p className="mt-1 leading-relaxed text-fg-2">Would have to happen and has no evidence yet: the revenue, volume, growth and market share each rung requires, and a platform-sized economy on NEAR.</p></div>
        </div>

        <h3 className="mt-8 text-lg font-[600]">Reverse view and checkpoints</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-2">Implied price in ten years = (today&apos;s Intents run rate × (1 + growth)^{HORIZON_YEARS} × buyback revenue per dollar of volume + burns at today&apos;s run rate) × cash-flow multiple ÷ supply in ten years, for {GROWTH_SCENARIOS.map((g) => `${g.label.toLowerCase()} growth (${g.cagr * 100}% a year)`).join(', ')}. These are scenarios, so results can fall below today&apos;s price. Checkpoints are the yearly volumes on each rung&apos;s required growth path at NEAR&apos;s own multiple today, so the thesis can be checked every year. The swing factor compares the spread of implied prices across growth scenarios with the spread across the cash-flow multiples; spreads within {SWING_SIMILAR}x of each other are reported as similar.</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">The headline sentence on the home page is generated from these numbers by code. The bands and growth scenarios are our judgment, set while building the pipeline and published so anyone can change them in <span className="num">src/lib/research/ladder.ts</span> and rebuild.</p>
      </section>

      <section id="tokenomics" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Token economics</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Every token flow is classified before anything is summed. Version <span className="num">{TOKENOMICS_VERSION}</span>.</p>
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border hairline">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-raised text-xs text-muted"><tr><th className="px-4 py-2.5 font-normal">Flow</th><th className="px-4 py-2.5 font-normal">Counted as</th><th className="px-4 py-2.5 font-normal">Why</th></tr></thead>
            <tbody>
              {[
                ['Intents fees, gas fees', 'Source of value', 'Paid by users; not yet captured by holders.'],
                ['Revenue designated for buybacks', 'Label only', 'DefiLlama classification (Dune lineage, shared with NEAR\'s revenue dashboard). Not a transaction.'],
                ['NEAR delivered to the buyback wallet', 'Value capture', 'NEAR withdrawn from intents.near (1Click swap output) to buybacks.multisignature.near, read from every transaction (FastNEAR), valued at market prices on delivery days, not verified purchase prices. Unavailable if any day lacks a price.'],
                ['Burns', 'Value capture', '70% of gas, permanently removed.'],
                ['Staking emissions', 'Redistribution', 'New tokens paid to stakers come from non-stakers\' share of supply.'],
                ['Net issuance', 'Dilution, subtracted', 'Realized change in total supply (NearBlocks), net of burns.'],
                ['Ecosystem app revenue', 'Excluded', 'Accrues to applications, not to $NEAR.'],
              ].map(([a, b, c]) => <tr key={a} className="border-t hairline"><th scope="row" className="px-4 py-3 font-[560]">{a}</th><td className="px-4 py-3">{b}</td><td className="px-4 py-3 text-fg-2">{c}</td></tr>)}
            </tbody>
          </table>
        </div>
        <pre className="num mt-6 overflow-x-auto rounded-[var(--radius-md)] border hairline bg-surface p-5 text-[0.8125rem] leading-7 text-fg-2">{`staking_ratio        = sum(current validators' stake) ÷ total supply            (NEAR RPC)
gross_issuance       = realized net supply growth + burns ÷ market cap
nominal_yield        = gross_issuance × (1 − protocol_reward_rate) ÷ staking_ratio
real_yield_staker    = (1 + nominal_yield) ÷ (1 + net supply growth) − 1
real_yield_holder    = 1 ÷ (1 + net supply growth) − 1                       (does not stake)
circulating_growth   = CoinGecko market cap ÷ price, last day vs a year earlier  (every asset)
holder_yield         = holders revenue, 90-day run rate ÷ market cap         (DefiLlama, every asset)
net_holder_yield     = holder_yield − circulating_growth`}</pre>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">Circulating supply from market cap divided by price is one method for every asset, so it includes unlocks that a protocol issuance rate leaves out. One-day changes above {SUPPLY_JUMP * 100}% are listed as reclassification or unlock events rather than smoothed away. Net holder yield excludes price, so it is a measure of token economics, not a return forecast.</p>
      </section>

      <section id="economy" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Economy map</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Every NEAR product is investigated on its own and placed in one column: observed activity, verified value capture for $NEAR (NEAR delivered to the buyback wallet, or burns), or speculative opportunity, which is never given a dollar value. The fee base is DefiLlama&apos;s fees overview filtered to the NEAR chain: it includes NEAR Intents&apos; cross-chain swap fees, which are paid on many chains and are not NEAR L1 gas. L1 activity compares matched 90-day windows a year apart (NearBlocks transactions and active accounts, DefiLlama gas fees). Chain Signatures is read from the v1.signer contract&apos;s state over RPC. Near Perps is a front end for Hyperliquid; its builder-code fees accrue to the front end, not to $NEAR.</p>
      </section>

      <section id="competition" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Competition</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">NEAR Intents is compared with sixteen cross-chain protocols on the same DefiLlama definitions and the same 90 days: volume where an adapter exists, fees, protocol revenue, holders revenue and take rate. Categories are never added together: only swap venues with public volume enter the volume share, so the share is of measured venues, not of all cross-chain execution. Token valuations use execution protocols with a token (swap venues, bridges, solvers); the median is shown with and without tokens under $25M, as a range, because the peer set is small and thinly traded. Valuing Intents revenue at that range is a conditional comparison, not a fair value of NEAR, whose market cap also prices the L1 and its other products.</p>
      </section>

      <section id="valuation" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Valuation and alternatives</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Two revenue bases are computed side by side and never mixed: DefiLlama&apos;s designated buybacks, and NEAR delivered to the buyback wallet (valued at market prices on delivery days). On each basis the multiple, the take rate and the projected flow use the same definition and the same 90 days, ending on one documented cutoff; peer multiples do not depend on the basis. NEAR&apos;s multiple history only uses windows that fall entirely after the flow began. For the alternatives, each asset is valued with the method that fits it (BTC monetary, platforms on their on-chain economy, Hyperliquid on cash flow, NEAR on both); the growth needed for the same price multiple holds each valuation ratio fixed and lets each asset&apos;s ownership dilution persist. That is a model result, not evidence about which asset is likely to deliver it. Risk uses daily DefiLlama prices: volatility, drawdown and correlation with BTC on consecutive days only.</p>
      </section>

      <section id="hypotheses" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Hypotheses</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Ten hypotheses (research/three-digits/SCOPE.md) were written before the data was read, each with the rule that decides it: supported, not supported, mixed, or untested when the data needed is not available. Claims were narrowed after review to what each test measures: H1 tests the concentration of fees attributed to the chain, H2 reports an observed valuation gap, H4 diverging trends, H5 ownership dilution on raw and event-adjusted supply, H6 a fixed-valuation model result, H10 dependence on BTC only. H7 to H9 need BigQuery or the NEAR Intents Explorer API.</p>
      </section>

      <section id="verdict" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Verdict and audit</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">The investment verdict is fixed prose, finalized after two external review passes. Every lead, trail and characteristic beneath it is generated by a rule from the data in <span className="num">src/lib/research/verdict.ts</span>, so a refresh can never leave a claim the numbers no longer support. Characteristics that can read either way (high turnover, low correlation with BTC) are listed as neither a lead nor a trail. Every correction, its resolution and whether it changed the ladder or the verdict is recorded in <span className="num">research/three-digits/AUDIT-LOG.md</span>.</p>
      </section>

      <section id="thesis" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Evidence rules behind the ladder</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">Supporting evidence from NEAR&apos;s track record and token economics, shown in the evidence section of the thesis. Each sub-question is answered by a fixed rule applied to stored data; no AI is involved. Rules version <span className="num">{THESIS_VERSION}</span>.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="panel p-5 text-sm">
            <p className="num text-xs text-mint">01 · Did it last?</p>
            <p className="mt-2 leading-relaxed text-fg-2">For each era&apos;s representative product, a monthly measure: {ERA_CONTRACTS.map((c) => `${c.account} ${c.metric} (${c.sourceName})`).join('; ')}. Only exact data is scored. For busy contracts in older months, NearBlocks returns a query-planner estimate instead of a count (its response carries a <code>cost</code> field); every month is checked and estimated months are excluded from scoring and charts. That is why v1.signer is measured from April 2026 and Intents by DefiLlama volume rather than intents.near transactions. An era <span className="text-fg">lasted</span> if its latest complete month keeps at least {RULES.eraRetentionLasting * 100}% of its own peak month, judged once the peak is {RULES.eraMinMonthsSincePeak}+ months old; a more recent peak is not judgeable yet.</p>
            <p className="mt-2 leading-relaxed text-muted">Points to building if at least two thirds of judged eras lasted; to hype if at most one third did; mixed otherwise; insufficient with fewer than two judged eras.</p>
          </div>
          <div className="panel p-5 text-sm">
            <p className="num text-xs text-mint">02 · Did adoption justify the hype?</p>
            <p className="mt-2 leading-relaxed text-fg-2">Each pivot has an announcement date and, where a product contract exists, a mainnet launch date (Chain Signatures: announced 27 March 2024, mainnet 8 August 2024). Adoption <span className="text-fg">followed</span> if the product contract&apos;s monthly transactions two months after the mainnet launch month reached at least {RULES.eraGrowthMultiple}x the launch month. Pivots without a single product contract (User-Owned AI) are N/A and excluded from the count, not scored as failures. Chain-wide daily active accounts around the announcement are context only, because they cannot be attributed to one product.</p>
            <p className="mt-2 leading-relaxed text-muted">Points to building if adoption followed at least half of the pivots. NEAR&apos;s price return minus BTC&apos;s is shown as context and never scored.</p>
          </div>
          <div className="panel p-5 text-sm">
            <p className="num text-xs text-mint">03 · Does it pay $NEAR?</p>
            <p className="mt-2 leading-relaxed text-fg-2">Annualized Intents buybacks divided by the dollar value of realized net new supply (90-day change in total supply, net of burns, at today&apos;s price).</p>
            <p className="mt-2 leading-relaxed text-muted">Points to building at {RULES.coveragePaying * 100}% or more, to hype below {RULES.coverageNotPaying * 100}%, mixed in between.</p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border hairline">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="px-4 pt-3 text-left text-sm font-[560] text-fg">Combining the sections<span className="block text-xs font-normal text-muted">Sections 1 and 3 decide; Section 2 sets confidence (moderate when it agrees with the verdict&apos;s direction, low otherwise).</span></caption>
            <thead className="text-xs text-muted"><tr><th className="px-4 py-2 text-left font-normal">Section 1</th><th className="px-4 py-2 text-left font-normal">Section 3</th><th className="px-4 py-2 text-left font-normal">Verdict</th></tr></thead>
            <tbody>
              {[['Building', 'Building', 'Building the future'], ['Hype', 'Hype', 'Following the hype'], ['Building', 'Mixed or hype', 'Technology is building; the investment case is unproven'], ['Mixed or hype', 'Building', 'The token is paid, but products are not lasting'], ['Mixed', 'Mixed or hype', 'Mixed evidence'], ['Insufficient (either)', '', 'Insufficient evidence']].map(([a, b, c]) => (
                <tr key={`${a}-${b}`} className="border-t hairline"><td className="px-4 py-2 text-fg-2">{a}</td><td className="px-4 py-2 text-fg-2">{b}</td><td className="px-4 py-2">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">Disclosure: these thresholds were written while building the pipeline, after some raw values had been seen. They are not a blind pre-registration. They live in <span className="num">src/lib/research/thesis.ts</span>; change them and run <span className="num">npm run research:rebuild</span> to see how sensitive the verdict is.</p>
      </section>

      <section id="model" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">The buyback demand target model</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">The model asks how much measurable NEAR Intents activity would be needed for the revenue it generates to fund token buybacks equal to a chosen share of market capitalization each year. It is a scenario calculation, not an econometric forecast. Formula version <span className="num">{FORMULA_VERSION}</span>.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <pre className="num overflow-x-auto rounded-[var(--radius-md)] border hairline bg-surface p-5 text-[0.8125rem] leading-7 text-fg-2">{`annual_buyback_demand_usd = V × f × c × b
buyback_demand_to_mcap    = annual_buyback_demand_usd ÷ M
required_annual_volume    = (y × M) ÷ (f × c × b)
volume_multiple_required  = required_annual_volume ÷ V
required_take_rate        = (y × M) ÷ V      (reverse)`}</pre>
          <dl className="grid gap-3 text-sm">
            {[
              ['M', 'Circulating market cap in USD (CoinGecko), with fetch timestamp. OBSERVED.'],
              ['V', 'NEAR Intents swap volume over the trailing 90 days × 365/90 (DefiLlama near-intents adapter). DERIVED run rate.'],
              ['f', 'Gross fees ÷ volume over the same 90 days and protocol scope. Gross fees include the protocol fee and distributor (affiliate) fees. DERIVED.'],
              ['c', 'NEAR-captured revenue ÷ gross fees, same window. Captured revenue is what DefiLlama measures as swept into NEAR revenue wallets; the rest goes to solvers and distributors. DERIVED.'],
              ['b', 'Holders revenue ÷ captured revenue: the share DefiLlama classifies as used for buybacks since 2026-02-23. DERIVED from a third-party classification, not a guaranteed policy.'],
              ['y', 'Target annual buyback demand as a share of market cap. Always ASSUMED; adjustable.'],
            ].map(([k, d]) => <div key={k} className="grid grid-cols-[2rem_1fr] gap-2"><dt className="num text-mint">{k}</dt><dd className="leading-relaxed text-fg-2">{d}</dd></div>)}
          </dl>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['A buyback is not a burn. Tokens bought back can be held (the buyback wallet balance is read onchain) and total supply does not fall unless they are burned.', 'Buyback demand does not raise price one-for-one. A 1% buyback-to-market-cap ratio is a flow of demand, not a 1% price change.', 'If any input is missing, zero, or out of range, results show N/A with the reason. The model never divides by zero or substitutes a value.'].map((t) => <p key={t} className="panel p-4 text-sm leading-relaxed text-muted">{t}</p>)}
        </div>
        <h3 className="mt-10 text-lg font-[600]">Scenario presets</h3>
        <p className="mt-1 text-sm text-muted">Set before looking at results. Every adjustment is an assumption.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {SCENARIOS.map((s) => <li key={s.key} className="panel p-4 text-sm"><p className="font-[600]">{s.label}</p><p className="mt-1 leading-relaxed text-muted">{s.rationale}</p><p className="num mt-2 text-xs text-faint">fee −{s.adjustments.feeCompression * 100}% · capture −{s.adjustments.captureHaircut * 100}% · b {s.adjustments.buybackShare === null ? 'measured' : `${s.adjustments.buybackShare * 100}%`} · growth +{s.adjustments.volumeGrowth * 100}% · y {s.adjustments.targetBuybackToMcap * 100}%</p></li>)}
        </ul>
        {fee && alloc && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Matrix m={fee} title="Fee compression × target" />
            <Matrix m={alloc} title="Buyback allocation × capture haircut (y = 2%)" />
          </div>
        )}
      </section>

      <section id="calculator" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Calculator</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-fg-2">Starts from the latest stored measurements{preview?.windowEnd ? ` (90-day window ending ${formatDate(preview.windowEnd)})` : ''}. Change any input to test a scenario; edited inputs become ASSUMED.</p>
        <div className="mt-6"><Calculator base={base} asOf={preview?.windowEnd ? formatDate(preview.windowEnd) : null} /></div>
      </section>

      <section id="ai" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Three roles, one shared truth set</h2>
        <ol className="mt-6 space-y-3 text-[0.9375rem] leading-relaxed text-fg-2">
          <li><span className="num mr-3 text-mint">1</span>The server fetches sources, validates and normalizes them, and freezes one snapshot per debate.</li>
          <li><span className="num mr-3 text-mint">2</span>All ratios and the model are computed by deterministic code outside the language model.</li>
          <li><span className="num mr-3 text-mint">3</span>Bull and Bear receive the same frozen evidence, the same model output and the opponent&apos;s prior turns. They have no browsing or tools.</li>
          <li><span className="num mr-3 text-mint">4</span>Each turn is strict JSON (validated with a schema): spoken beats, at most four claims, each with evidence IDs and a fact, inference or assumption label.</li>
          <li><span className="num mr-3 text-mint">5</span>The audit rejects unknown evidence IDs, flags numbers that match no snapshot value (3.5% tolerance), checks length and rebuttal references, and asks for one repair if needed. Remaining problems are stored and shown.</li>
          <li><span className="num mr-3 text-mint">6</span>The Judge receives both transcripts, the evidence, the model output and the audit, and must challenge the model inputs.</li>
          <li><span className="num mr-3 text-mint">7</span>Every turn stores its text hash, model, prompt version ({PROMPT_VERSION}), latency, audit and audio reference. Voices read the stored text exactly; they never generate content.</li>
        </ol>
        <p className="mt-4 text-sm text-muted">Provider text (labels, adapter methodology) is passed as inert data and sanitized. Users cannot supply URLs or free text to the server: debates accept only the one thesis topic.</p>
      </section>

      <section id="scoring" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Scoring</h2>
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border hairline">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-raised text-xs text-muted"><tr><th className="px-4 py-2.5 text-left font-normal">Dimension</th><th className="px-4 py-2.5 text-right font-normal">Points</th><th className="px-4 py-2.5 text-left font-normal">Assessed by</th></tr></thead>
            <tbody>
              {[['Evidence accuracy and traceability', 40, 'AI Judge, then deterministic penalties: 4 per unsupported claim, 2 per unmatched number, 3 per invalid citation (max 30)'], ['Quantitative method and causal reasoning', 20, 'AI Judge'], ['Rebuttal quality and counterevidence', 20, 'AI Judge'], ['Recognition of risks and unknowns', 10, 'AI Judge'], ['Transparency of assumptions', 10, 'AI Judge']].map(([d, p, a]) => (
                <tr key={d as string} className="border-t hairline"><td className="px-4 py-2.5">{d}</td><td className="num px-4 py-2.5 text-right">{p}</td><td className="px-4 py-2.5 text-xs text-muted">{a}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">If penalized totals contradict the Judge&apos;s pick, the server overrides it: to the other side if it leads by 5 or more, otherwise to Inconclusive, and records why. The score is a debate argument score. It is not a NEAR investment score, a price forecast or a probability of profit.</p>
      </section>

      <section id="sources" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Data sources</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {Object.values(SOURCES).map((s) => (
            <li key={s.id} className="panel p-4 text-sm">
              <p className="font-[600]">{s.name}</p>
              <p className="mt-1 text-muted">{s.kind}{s.requiresCredential ? ' · credential required' : ' · public'} · minimum gap {s.minGapMs / 1000}s between requests</p>
              <p className="mt-2"><ExternalLink href={s.docsUrl} className="text-xs">Documentation</ExternalLink></p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">Evidence methodology <span className="num">{METHODOLOGY_VERSION}</span>. The full request catalog lives in <span className="num">src/lib/data/sources.ts</span>; nothing else in the code chooses a URL.</p>
      </section>

      <section id="limits" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">Known limitations</h2>
        <ul className="mt-6 space-y-3 text-[0.9375rem] leading-relaxed text-fg-2">
          <li><span className="text-fg">Accounts are not people.</span> Active-account counts include bots, relayers and multiple accounts per person, and falling counts can mean less automation as well as fewer users.</li>
          <li><span className="text-fg">Volume is not organic demand.</span> Without the partner-only Intents Explorer API, integrator concentration and wash-like activity cannot be measured.</li>
          <li><span className="text-fg">Third-party definitions.</span> Fee, revenue and buyback figures follow DefiLlama adapter definitions, which can change. Definitions are stored in each snapshot.</li>
          <li><span className="text-fg">Valuation multiples move with sentiment.</span> Today&apos;s multiples are applied to NEAR in ten years as scenarios. The same rung can look easy or extreme depending on the multiple, which is why every column is shown.</li>
          <li><span className="text-fg">One measured value channel.</span> The ladder counts value reaching holders through Intents buybacks and gas burns. Other possible sources (staking demand, AI agents, NEAR as money) are not quantified because no reliable data supports a number yet; they are listed as unproven, not added.</li>
          <li><span className="text-fg">Exact data only.</span> NearBlocks returns query-planner estimates instead of counts for busy contracts in older months; those months are flagged and excluded, so some history is shorter than the contract&apos;s life.</li>
          <li><span className="text-fg">BigQuery is optional.</span> Retention cohorts need your own Google Cloud project (research/sql/), so they are not part of the live snapshot.</li>
          <li><span className="text-fg">Cross-chain comparability.</span> Chain-fee multiples ignore value that fees do not capture, and TVL definitions vary by adapter.</li>
          <li><span className="text-fg">Subjective scores.</span> Most rubric points are an AI judgement. They are shown with the deterministic audit so readers can disagree.</li>
        </ul>
      </section>
    </Container>
  );
}
