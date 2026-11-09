import type { Metadata } from 'next';
import { Calculator } from '@/components/calculator';
import { Container, ExternalLink } from '@/components/ui';
import { previewTopic } from '@/lib/debate/preview';
import { ERA_CONTRACTS, SOURCES } from '@/lib/data/sources';
import { RULES, THESIS_VERSION } from '@/lib/research/thesis';
import { formatDate, formatValue } from '@/lib/format';
import { allocationSensitivity, FORMULA_VERSION, SCENARIOS, sensitivity, type SensitivityMatrix } from '@/lib/research/model';
import { METHODOLOGY_VERSION } from '@/lib/research/evidence';
import { PROMPT_VERSION } from '@/lib/ai/prompts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Methodology and model', description: 'How this thesis builds evidence snapshots, computes the buyback demand target model, audits AI arguments and scores debates.' };

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

  return (
    <Container className="max-w-[1100px] py-12 md:py-16">
      <p className="eyebrow mb-3">Methodology</p>
      <h1 className="display-l text-balance">How the thesis is tested.</h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg-2">This is an educational research project. It tests whether NEAR is building the future or following the hype against measured, reproducible data, and shows how a bull and a bear case hold up against the same evidence. It does not forecast prices, rate NEAR as an investment, or give financial advice.</p>

      <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm">
        {[['#principles', 'Principles'], ['#thesis', 'The verdict rules'], ['#model', 'The model'], ['#calculator', 'Calculator'], ['#ai', 'AI and audit'], ['#scoring', 'Scoring'], ['#sources', 'Data sources'], ['#limits', 'Limitations']].map(([h, l]) => <a key={h} href={h} className="chip h-8 px-3 hover:text-fg">{l}</a>)}
      </nav>

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

      <section id="thesis" className="scroll-mt-20 mt-16 border-t hairline pt-10">
        <h2 className="display-m">How the verdict is decided</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">The thesis asks three sub-questions. Each is answered by a fixed rule applied to stored data, and the verdict combines them by a rule published here. No AI is involved in any of these steps. Thesis rules version <span className="num">{THESIS_VERSION}</span>.</p>
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
break_even_annual_volume  = (y × M) ÷ (f × c × b)
volume_multiple_required  = break_even_annual_volume ÷ V
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
        <p className="mt-4 text-sm text-muted">Provider text (labels, adapter methodology) is passed as inert data and sanitized. Users cannot supply URLs or free text to the server: debates accept only one of three topic slugs.</p>
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
          <li><span className="text-fg">BigQuery freshness.</span> NEAR Lake, the upstream of the public BigQuery dataset, stopped indexing new blocks on 2026-03-24. Retention cohorts are not in live snapshots.</li>
          <li><span className="text-fg">Cross-chain comparability.</span> Chain-fee multiples ignore value that fees do not capture, and TVL definitions vary by adapter.</li>
          <li><span className="text-fg">Subjective scores.</span> Most rubric points are an AI judgement. They are shown with the deterministic audit so readers can disagree.</li>
        </ul>
      </section>
    </Container>
  );
}
