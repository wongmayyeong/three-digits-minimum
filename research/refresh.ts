/**
 * One-command reproducible research workflow.
 *
 *   npm run research:refresh            fetch live sources, rebuild everything
 *   npm run research:rebuild            offline: rebuild from committed raw responses only
 *   npm run research:refresh -- --verify   also check the offline rebuild is byte-identical
 *
 * Outputs (artifacts/research/):
 *   raw/<request>.json + raw/manifest.json   projected provider responses, URL, time, SHA-256
 *   canonical.json                           every evidence item, model inputs/outputs, scenarios, triggers
 *   evidence-manifest.json                   per metric: query URL, period, unit, transform, raw hash
 *   charts/<evidenceId>.json                 chart datasets
 *   dashboard.html                           static dashboard: chart + query + one sentence each
 * and regenerates THESIS.md from research/THESIS.template.md.
 *
 * Fails (exit 1) when a necessary source has neither a fresh nor a stored response. It never
 * substitutes a value.
 */
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchAll } from '@/lib/data/fetcher';
import { BUYBACK_KEY, fetchBuybackTransfers } from '@/lib/data/fastnear';
import { buildBackgroundRequests, buildRequestCatalog, sha256, stableStringify } from '@/lib/data/sources';
import { evidenceForAgainst } from '@/lib/research/thesis';
import { fileRawStore } from '@/lib/data/stores';
import { buildDataset } from '@/lib/research/evidence';
import { GROWTH_SCENARIOS } from '@/lib/research/ladder';
import { evaluateTriggers } from '@/lib/research/triggers';
import type { EvidenceDraft } from '@/lib/research/types';
import { formatDate, formatPeriod, formatValue } from '@/lib/format';
import { renderDashboard } from './dashboard';

const ROOT = join(process.cwd(), 'artifacts', 'research');
const RAW = join(ROOT, 'raw');
const NECESSARY = ['coingecko.markets', 'defillama.intents.volume', 'defillama.intents.dailyFees', 'defillama.intents.dailyRevenue', 'nearblocks.charts'];

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
// --accept rewrites the committed outputs after an intentional methodology change (skips the byte-identical check).
const verify = (args.has('--verify') || offline) && !args.has('--accept');

async function build(offlineMode: boolean) {
  const store = fileRawStore(RAW);
  const outcomes = await fetchAll(buildRequestCatalog(), store, { offline: offlineMode, forceFresh: !offlineMode });
  // Closed months never change, so era history is fetched once and then reused (not forced fresh).
  const era = await fetchAll(buildBackgroundRequests(), store, { offline: offlineMode });
  const eraFetched = era.filter((o) => o.status === 'OK' && !o.cacheHit).length;
  console.log(`  era history: ${era.filter((o) => o.record).length}/${era.length} months available (${eraFetched} fetched now)`);
  const buybacks = await fetchBuybackTransfers(store, { offline: offlineMode });
  console.log(`  buyback transfers: ${buybacks ? (buybacks.body as { transfers: unknown[] }).transfers.length : 'unavailable'}`);
  const raws = { ...Object.fromEntries([...outcomes, ...era].map((o) => [o.key, o.record])), [BUYBACK_KEY]: buybacks };
  const ds = buildDataset(raws);
  const triggers = evaluateTriggers(ds.evidence);
  const manifest = store.manifest();
  return { outcomes, ds, triggers, manifest };
}

function canonicalOf(ds: ReturnType<typeof buildDataset>, triggers: ReturnType<typeof evaluateTriggers>) {
  return {
    methodologyVersion: ds.methodologyVersion,
    formulaVersion: ds.formulaVersion,
    windowEnd: ds.windowEnd,
    peerWindowEnd: ds.peerWindowEnd,
    evidence: ds.evidence.map(({ series, ...e }) => ({ ...e, hasSeries: !!series })),
    model: { base: ds.modelBase, scenarios: ds.scenarios, feeSensitivity: ds.feeSensitivity, allocationMatrix: ds.allocationMatrix },
    triggers,
    thesis: ds.thesis,
    ladder: ds.ladder,
  };
}

function renderThesis(templateIn: string, ev: EvidenceDraft[], ds: ReturnType<typeof buildDataset>, triggers: ReturnType<typeof evaluateTriggers>, missing: string[]): string {
  const byId = new Map(ev.map((e) => [e.evidenceId, e]));
  let template = templateIn;
  const t = ds.thesis;
  const fa = evidenceForAgainst(t, triggers);
  const NL = '\n';
  const bullets = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join(NL) : '- None under the current data.');
  const VERDICT_TEXT: Record<string, string> = { BUILDING: 'Building the future', 'FOLLOWING THE HYPE': 'Following the hype', 'BUILDING, NOT YET PAYING': 'Technology is building; the investment case is unproven', 'PAYING, NOT LASTING': 'The token is paid, but products are not lasting', MIXED: 'Mixed evidence', 'INSUFFICIENT EVIDENCE': 'Insufficient evidence' };
  const fmtPct = (v: number | null, signed = false) => formatValue(v, 'fraction', { signed });
  const sectionRows = t.sections.map((x) => `| ${x.id}. ${x.title} | ${x.verdict} | ${x.reason} |`);
  const eraRows = t.eras.map((e) => `| ${e.era} | \`${e.account}\`, ${e.metric} (${e.sourceName}) | ${e.exactFrom ?? 'n/a'}${e.estimatedMonths.length ? ` (${e.estimatedMonths.length} months were estimates, excluded)` : ''} | ${formatValue(e.peak, e.unit)} (${e.peakMonth ?? 'n/a'}) | ${formatValue(e.latest, e.unit)} (${e.latestMonth ?? 'n/a'}) | ${fmtPct(e.retention)} | ${e.lasted === null ? 'not judgeable yet' : e.lasted ? 'yes' : 'no'} |`);
  const eventRows = t.events.map((v) => `| [${v.label}](${v.source}) | ${v.shown} | ${v.productAccount ? '`' + v.productAccount + '` from ' + v.productLaunchShown : 'no single product contract'} | ${v.eraGrowth === null ? 'n/a' : formatValue(v.eraGrowth, 'ratio')} | ${v.adoptionFollowed === null ? 'N/A, not counted' : v.adoptionFollowed ? 'yes' : 'no'} | ${fmtPct(v.daaChange, true)} | ${fmtPct(v.relativeReturn90, true)} |`);
  template = template
    .replace('{{THESIS_VERDICT}}', VERDICT_TEXT[t.verdict] ?? t.verdict)
    .replace('{{THESIS_CONFIDENCE}}', t.confidence)
    .replace('{{SECTION_TABLE}}', ['| Sub-question | Reading | Why |', '|---|---|---|', ...sectionRows].join(NL))
    .replace('{{EVIDENCE_FOR}}', bullets(fa.forBuilding))
    .replace('{{EVIDENCE_AGAINST}}', bullets(fa.againstBuilding))
    .replace('{{ERA_TABLE}}', ['| Era | Product and measure | Exact data | Peak month | Latest month | Kept of peak | Lasted? |', '|---|---|---|---|---|---|---|', ...eraRows].join(NL))
    .replace('{{EVENT_TABLE}}', ['| Pivot | Announced | Product and mainnet launch | Product activity, launch +2 months (scored) | Adoption followed? | Chain active accounts, +90d (context) | NEAR minus BTC, +90d (context) |', '|---|---|---|---|---|---|---|', ...eventRows].join(NL))
    .replace('{{SUP-BUYBACK-ANN}}', formatValue(t.supply.buybackAnnualUsd, 'USD'));
  let out = template.replace(/\{\{([A-Z0-9-]+)(?:\.(period|source|type))?\}\}/g, (_, id: string, field?: string) => {
    const e = byId.get(id);
    if (!e) return `[unknown evidence ${id}]`;
    if (field === 'period') return formatPeriod(e.periodStart, e.periodEnd);
    if (field === 'source') return e.sourceName;
    if (field === 'type') return e.observationType;
    if (!e.available) { missing.push(id); return `unavailable (${id})`; }
    return e.valueText ? e.valueText : formatValue(e.value, e.unit);
  });
  const vToday = ds.evidence.find((e) => e.evidenceId === 'INT-VOL-ANN')?.value ?? null;
  const scen = ds.scenarios.map((s) => `| ${s.label} | ${formatValue(s.outputs.annualBuybackDemandUsd, 'USD')} | ${formatValue(s.outputs.buybackDemandToMcap, 'fraction')} | ${formatValue(s.outputs.breakEvenAnnualVolumeUsd, 'USD')} | ${formatValue(vToday && s.outputs.breakEvenAnnualVolumeUsd !== null ? s.outputs.breakEvenAnnualVolumeUsd / vToday : null, 'ratio')} | ${formatValue(s.outputs.volumeMultipleRequired, 'ratio')} | ${s.rationale} |`).join('\n');
  out = out.replace('{{SCENARIO_TABLE}}', `| Scenario | Annual buyback demand | Buyback / market cap | Volume for 2% of market cap | x today's volume | x scenario's volume | Assumptions |\n|---|---|---|---|---|---|---|\n${scen}`);
  const fee = ds.feeSensitivity;
  out = out.replace('{{SENSITIVITY_TABLE}}', `| Fee compression \\ target y | ${fee.cols.map((c) => formatValue(c, 'fraction')).join(' | ')} |\n|---|${fee.cols.map(() => '---').join('|')}|\n${fee.rows.map((r, i) => `| ${formatValue(r, 'fraction')} | ${fee.cells[i]!.map((v) => formatValue(v, 'ratio')).join(' | ')} |`).join('\n')}`);
  out = out.replace('{{TRIGGER_TABLE}}', `| ID | Falsification trigger | Rule | Current reading | Status |\n|---|---|---|---|---|\n${triggers.map((t) => `| ${t.id} | ${t.statement} | \`${t.rule}\` | ${t.observed} | **${t.status}** |`).join('\n')}`);

  // ---- three-digit ladder
  const l = ds.ladder;
  const BAND: Record<string, string> = { holds: 'keeps today\'s size', gains: 'up to 5x', dominant: '5x to 10x', beyond: 'more than 10x' };
  const mToday = l.multiples.find((m) => m.key === 'today');
  out = out.replace(/\{\{LADDER_RUN_RATE_DAYS\}\}/g, String(l.basis.runRateDays)).replace(/\{\{LADDER_WINDOW_END\}\}/g, formatDate(l.basis.windowEnd))
    .replace('{{LADDER_BASIS_NOTE}}', [l.basis.trailingNote, ...l.exclusions].join(' '))
    .replace('{{LADDER_TRON_HARDER}}', formatValue(mToday?.value != null && l.multiples.find((m) => m.key === 'tron')?.value ? mToday.value / l.multiples.find((m) => m.key === 'tron')!.value! : null, 'ratio'));
  const r100 = l.rungs.find((r) => r.price === 100);
  const cap = (label: string) => l.peers.find((p) => p.label === label)?.marketCap ?? null;
  const ratio = (a: number | null | undefined, b: number | null | undefined) => (a != null && b ? a / b : null);
  out = out.replace(/\{\{LADDER_HEADLINE\}\}/g, l.headline);
  out = out.replace('{{DREAM_TABLE}}', ['| | Today | At $100 in ten years |', '|---|---|---|',
    `| Price | ${formatValue(l.inputs.price, 'USD')} | $100 (${formatValue(r100?.priceMultiple ?? null, 'ratio')}) |`,
    `| Market cap (2.5% issuance) | ${formatValue(l.inputs.marketCap, 'USD')} | ${formatValue(r100?.marketCap ?? null, 'USD')} |`,
    `| Market cap if HSP-029 takes effect | | ${formatValue(r100?.marketCapHsp029 ?? null, 'USD')} |`,
    `| Rank among crypto assets (stablecoins excluded) | | #${r100?.rankToday ?? 'n/a'} against today's market |`,
    `| Share of all crypto (${formatValue(l.inputs.totalCryptoCap, 'USD')} today) | ${formatValue(ratio(l.inputs.marketCap, l.inputs.totalCryptoCap), 'fraction')} | ${formatValue(r100?.shareOfCryptoToday ?? null, 'fraction')} |`,
    `| Versus Solana / Ethereum today | | ${formatValue(ratio(r100?.marketCap, cap('Solana')), 'ratio')} / ${formatValue(ratio(r100?.marketCap, cap('Ethereum')), 'ratio')} |`].join(NL));
  out = out.replace('{{REGIMES_TABLE}}', [`| Token | Framework | Market cap | To holders a year (${l.basis.runRateDays}-day run rate) | Multiple | Multiple, trailing year |`, '|---|---|---|---|---|---|',
    ...l.peers.map((p) => `| ${p.label} | ${p.regime === 'platform' ? 'Platform (on-chain economy)' : 'Cash flow'} | ${formatValue(p.marketCap, 'USD')} | ${formatValue(p.holdersRevenueRunRate, 'USD')} | ${formatValue(p.multiple, 'ratio')} | ${formatValue(p.multiple365, 'ratio')} |`),
    `| **NEAR** (gas burned + Intents revenue designated for buybacks) | Both tested here | ${formatValue(l.inputs.marketCap, 'USD')} | ${formatValue(l.inputs.captureToday, 'USD')} | ${formatValue(mToday?.value ?? null, 'ratio')} | ${formatValue(mToday?.value365 ?? null, 'ratio')} |`].join(NL));
  out = out.replace('{{LADDER_TABLE}}', [`| Rung (ten years) | ${l.multiples.map((m) => `${m.label} (${formatValue(m.value, 'ratio')})`).join(' | ')} |`, `|---|${l.multiples.map(() => '---').join('|')}|`,
    ...[...l.rungs].reverse().map((r) => `| **$${r.price}** (${formatValue(r.priceMultiple, 'ratio')}, ${formatValue(r.marketCap, 'USD')}, #${r.rankToday}) | ${r.byMultiple.map((b) => `${formatValue(b.dexShare2036, 'fraction')} (${b.band ? BAND[b.band] : 'n/a'})`).join(' | ')} |`)].join(NL));
  out = out.replace('{{CONDITIONS_TABLE}}', ['| Rung | Value to holders needed | Intents volume needed | Growth needed, 10 years | NEAR keeps its multiple | Buyback revenue per dollar holds |', '|---|---|---|---|---|---|',
    ...l.rungs.map((r) => { const b = r.byMultiple.find((x) => x.multipleKey === 'today')!; return `| $${r.price} | ${formatValue(b.requiredCapture, 'USD')}/yr, ${formatValue(b.captureMultiple, 'ratio')} today (unproven) | ${formatValue(b.requiredVolume, 'USD')}/yr (unproven) | ${formatValue(b.requiredCagr, 'fraction')} a year (unproven; today ${formatValue(l.inputs.intentsYoY, 'fraction')} YoY, observed) | assumed | assumed |`; })].join(NL));
  out = out.replace('{{IMPLIED_TABLE}}', [`| Intents growth to 2036 | ${l.multiples.map((m) => m.label).join(' | ')} |`, `|---|${l.multiples.map(() => '---').join('|')}|`,
    ...l.implied.map((g) => { const s = GROWTH_SCENARIOS.find((x) => x.key === g.growthKey)!; return `| ${s.label}, ${formatValue(s.cagr, 'fraction')} a year | ${g.byMultiple.map((b) => `${formatValue(b.price, 'USD')} (${formatValue(b.multipleOfToday, 'ratio')})`).join(' | ')} |`; })].join(NL));
  out = out.replace('{{SWING_SENTENCE}}', l.swing.sentence);
  const cps = l.checkpoints.filter((c) => c.years.length);
  const yrs = cps[0]?.years.map((y) => y.year) ?? [];
  out = out.replace('{{CHECKPOINT_TABLE}}', [`| Rung | ${yrs.join(' | ')} |`, `|---|${yrs.map(() => '---').join('|')}|`,
    ...[...cps].reverse().map((c) => `| $${c.price} | ${c.years.map((y) => formatValue(y.volume, 'USD')).join(' | ')} |`)].join(NL));
  const platName = (b: string) => (b === 'BSC' ? 'BNB Chain' : b);
  const nearPlat = l.platform.find((p) => p.chain === 'Near');
  out = out.replace('{{PLATFORM_TABLE}}', [`| Valued like | On NEAR | Market cap ratio | ${l.rungs.map((r) => '$' + r.price).join(' | ')} |`, `|---|---|---|${l.rungs.map(() => '---').join('|')}|`,
    ...l.platform.filter((p) => p.chain !== 'Near').flatMap((p) => ([['Stablecoins', 'stablecoins', 'stablecoinsMultiple', p.capToStablecoins], ['DeFi TVL', 'tvl', 'tvlMultiple', p.capToTvl]] as const).map(([metric, f, m, ratioV]) =>
      `| ${platName(p.chain)} | ${metric} | ${formatValue(ratioV, 'ratio')} | ${l.rungs.map((r) => { const x = r.platform.find((y) => y.benchmark === p.chain); return `${formatValue(x?.[f] ?? null, 'USD')} (${formatValue(x?.[m] ?? null, 'ratio')})`; }).join(' | ')} |`)),
    `| NEAR today | | | Stablecoins ${formatValue(nearPlat?.stablecoins ?? null, 'USD')}; DeFi TVL ${formatValue(nearPlat?.tvl ?? null, 'USD')} | | | |`].join(NL));
  // ---- W4 token economics
  const tk = ds.tokenomics;
  const CLS: Record<string, string> = { source: 'Source of value, not captured', label: 'Label, not a transaction', capture: '**Value capture**', redistribution: 'Redistribution (new tokens)', dilution: '**Dilution** (subtracted)', excluded: 'Not $NEAR value' };
  out = out.replace('{{TOK_TAXONOMY_TABLE}}', ['| Flow | What it is | Per year | Classification |', '|---|---|---|---|',
    ...tk.taxonomy.map((r) => `| ${r.flow} | ${r.what} | ${r.usdPerYear === null ? 'not summed' : formatValue(r.usdPerYear, 'USD')} | ${CLS[r.cls]} |`),
    `| **Verified capture minus net issuance** | | **${formatValue(tk.netValueToHoldersUsd, 'USD')}** | Net value to holders |`].join(NL));
  out = out.replace('{{TOK_FINDINGS}}', tk.findings.map((f) => `- ${f}`).join(NL));
  out = out.replace('{{TOK_FIRST_RECEIPT}}', tk.buybacks.firstReceipt ?? 'n/a');
  out = out.replace('{{TOK_BUYBACK_TABLE}}', ['| Month | NEAR bought | Executed (USD) | Designated (USD) | Executed / designated |', '|---|---|---|---|---|',
    ...tk.buybacks.monthly.map((m) => `| ${m.month} | ${formatValue(m.executedNear, 'NEAR')} | ${formatValue(m.executedUsd, 'USD')} | ${formatValue(m.designatedUsd, 'USD')} | ${formatValue(m.executedUsd !== null && m.designatedUsd ? m.executedUsd / m.designatedUsd : null, 'fraction')} |`)].join(NL));
  out = out.replace('{{TOK_ASSETS_TABLE}}', ['| Asset | Valued as | Market cap | Supply still to unlock (FDV / cap) | Circulating supply growth, 1 year (as reported) | Excluding one-day events | Held buybacks subtracted | **Dilution net of capture** | Holder yield (context) |', '|---|---|---|---|---|---|---|---|---|',
    ...[...tk.assets].sort((a, b) => (a.dilutionNetOfCapture ?? 9) - (b.dilutionNetOfCapture ?? 9)).map((a) => `| ${a.label === 'NEAR' ? '**NEAR**' : a.label} | ${a.type} | ${formatValue(a.marketCap, 'USD')} | ${formatValue(a.fdvToMcap, 'ratio')} | ${formatValue(a.circGrowth1y, 'fraction', { signed: true })}${a.jumps.length ? ` (${a.jumps.length} event${a.jumps.length > 1 ? 's' : ''}: ${a.jumps.map((j) => `${j.day} ${formatValue(j.change, 'fraction', { signed: true })}`).join(', ')})` : ''} | ${formatValue(a.circGrowthExEvents, 'fraction', { signed: true })} | ${a.heldBuybackRate ? formatValue(a.heldBuybackRate, 'fraction') : '0'} | **${formatValue(a.dilutionNetOfCapture, 'fraction', { signed: true })}** | ${a.holderYield === null ? (a.type === 'monetary' ? 'none' : 'n/a') : formatValue(a.holderYield, 'fraction')} |`)].join(NL));
  // ---- W5 valuation and W6 opportunity cost
  const va = ds.valuation;
  const months = va.multiplesOverTime[0]?.points.map((p) => p.month) ?? [];
  const pick = months.filter((_, i) => i % 2 === 1 || i === months.length - 1);
  out = out.replace('{{VAL_HISTORY_TABLE}}', [`| Asset (basis) | ${pick.join(' | ')} |`, `|---|${pick.map(() => '---').join('|')}|`,
    ...va.multiplesOverTime.map((m) => `| ${m.label === 'NEAR' ? '**NEAR**' : m.label} (${m.basis}) | ${pick.map((mm) => formatValue(m.points.find((p) => p.month === mm)?.value ?? null, 'ratio')).join(' | ')} |`)].join(NL));
  out = out.replace('{{VAL_SENSITIVITY_TABLE}}', [`| Input (base case: ${formatValue(va.sensitivity.base, 'USD')} in 2036) | Low case | Price | High case | Price | High / low |`, '|---|---|---|---|---|---|',
    ...va.sensitivity.rows.map((r) => `| ${r.input} | ${r.lowLabel} | ${formatValue(r.low, 'USD')} | ${r.highLabel} | ${formatValue(r.high, 'USD')} | ${formatValue(r.swing, 'ratio')} |`)].join(NL));
  out = out.replace('{{VAL_NEEDED_TABLE}}', [`| Rung | ${GROWTH_SCENARIOS.map((g) => `${g.label} growth (${g.cagr * 100}% a year)`).join(' | ')} |`, `|---|${GROWTH_SCENARIOS.map(() => '---').join('|')}|`,
    ...va.multipleNeeded.map((m) => `| $${m.price} | ${m.byGrowth.map((g) => formatValue(g.multiple, 'ratio')).join(' | ')} |`)].join(NL));
  out = out.replace('{{OPP_TABLE}}', ['| Asset | Valued on | Dilution a year | Driver growth needed for 2.8x / 7x / 14x / 28x, a year for ten years | Observed growth, last year | Note |', '|---|---|---|---|---|---|',
    ...va.opportunity.map((o) => `| ${o.label === 'NEAR' ? '**NEAR**' : o.label} | ${o.driver} | ${formatValue(o.dilutionPerYear, 'fraction')} | ${o.type === 'monetary' ? `market cap ${o.targets.map((t) => formatValue(t.shareOfCryptoToday, 'fraction')).join(' / ')} of today's total crypto` : o.targets.map((t) => formatValue(t.requiredCagr, 'fraction')).join(' / ')} | ${o.observedGrowth === null ? 'n/a' : formatValue(o.observedGrowth, 'fraction', { signed: true })} | ${o.observedNote ?? (o.platform ? `Stablecoins ${formatValue(o.platform.stablecoinsGrowth, 'fraction', { signed: true })}, DeFi TVL ${formatValue(o.platform.tvlGrowth, 'fraction', { signed: true })}` : o.observedBasis)} |`)].join(NL));
  out = out.replace('{{VAL_FINDINGS}}', va.findings.map((f) => `- ${f}`).join(NL));
  out = out.replace('{{RISK_TABLE}}', ['| Asset | Volatility, 1 year | Volatility, 3 years | Max drawdown, 3 years | Price vs 3-year peak | Correlation with BTC, 1 year | Volume / market cap, 24h | Supply still to unlock |', '|---|---|---|---|---|---|---|---|',
    ...va.opportunity.map((o) => `| ${o.label === 'NEAR' ? '**NEAR**' : o.label} | ${formatValue(o.risk.vol1y, 'fraction')} | ${formatValue(o.risk.vol3y, 'fraction')} | ${formatValue(o.risk.maxDrawdown3y, 'fraction')} | ${formatValue(o.risk.fromPeak3y, 'fraction')} | ${o.risk.corrBtc1y === null ? 'n/a' : o.risk.corrBtc1y.toFixed(2)} | ${formatValue(o.risk.liquidity, 'fraction')} | ${formatValue(o.risk.fdvToMcap, 'ratio')} |`)].join(NL));
  // ---- W3 economy map
  const ec = ds.economy;
  const COL: Record<string, string> = { OBSERVED: 'Observed', VERIFIED: '**Verified capture**', SPECULATIVE: '*Speculative*' };
  out = out.replace('{{ECO_PRODUCT_TABLE}}', ['| Product | Activity (observed) | Value capture for $NEAR | Column | Possible upside (not valued) | Sources |', '|---|---|---|---|---|---|',
    ...ec.products.map((p) => `| ${p.product} | ${p.activity} | ${p.capture} | ${COL[p.column]} | ${p.speculative} | ${p.sources} |`)].join(NL));
  out = out.replace('{{ECO_FEES_TABLE}}', ['| Protocol | Category | Fees, 30 days | Share |', '|---|---|---|---|',
    ...ec.feesOnNear.slice(0, 8).map((p) => `| ${p.name} | ${p.category} | ${formatValue(p.fees30d, 'USD')} | ${formatValue(p.share, 'fraction')} |`)].join(NL));
  out = out.replace('{{ECO_FINDINGS}}', ec.findings.map((f) => `- ${f}`).join(NL));
  // ---- W2 cross-chain competition
  const cc = ds.crossChain;
  out = out.replace('{{CC_TABLE}}', ['| Protocol | Role | Volume a year (run rate) | Volume growth, year | Fees a year | Protocol revenue a year | Revenue per $ of volume | To token holders a year | Token | Market cap | Market cap / revenue | Market cap / holders revenue |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...cc.rows.map((r) => `| ${r.name === 'NEAR Intents' ? '**NEAR Intents**' : r.name} | ${r.role} | ${r.volumeRunRate === null ? 'not tracked' : formatValue(r.volumeRunRate, 'USD')} | ${r.volumeYoY === null ? 'n/a' : formatValue(r.volumeYoY, 'fraction', { signed: true })} | ${r.notes.some((n) => n.includes('swap costs')) ? `${formatValue(r.feesRunRate, 'USD')} (includes swap costs)` : formatValue(r.feesRunRate, 'USD')} | ${formatValue(r.revenueRunRate, 'USD')} | ${r.takeRate === null ? 'n/a' : `${(r.takeRate * 1e4).toFixed(2)} bp`} | ${r.holdersRunRate === null ? 'not tracked' : formatValue(r.holdersRunRate, 'USD')} | ${r.token ?? 'none'} | ${formatValue(r.marketCap, 'USD')} | ${formatValue(r.capToRevenue, 'ratio')} | ${formatValue(r.capToHolders, 'ratio')} |`)].join(NL));
  out = out.replace('{{CC_FINDINGS}}', cc.findings.map((f) => `- ${f}`).join(NL));
  const register = ev.map((e) => `| ${e.evidenceId} | ${e.label} | ${e.available ? (e.valueText ? 'text' : formatValue(e.value, e.unit)) : 'unavailable'} | ${e.observationType} | ${formatPeriod(e.periodStart, e.periodEnd)} | ${e.sourceName} |`).join('\n');
  out = out.replace('{{EVIDENCE_REGISTER}}', `| ID | Metric | Value | Type | Period | Source |\n|---|---|---|---|---|---|\n${register}`);
  out = out.replace('{{WINDOW_END}}', formatDate(ds.windowEnd)).replace('{{PEER_WINDOW_END}}', formatDate(ds.peerWindowEnd));
  return out;
}

async function main() {
  console.log(offline ? 'Offline rebuild from artifacts/research/raw' : 'Fetching live sources (about a minute; the first run also collects monthly era history, about 15 minutes at NearBlocks free-tier pacing)');
  const { outcomes, ds, triggers, manifest } = await build(offline);
  for (const o of outcomes) {
    const tag = o.status === 'OK' ? (o.stale ? 'STALE' : o.cacheHit ? 'stored' : 'fetched') : o.status;
    if (o.status !== 'OK' || o.stale || !offline) console.log(`  ${tag.padEnd(12)} ${o.key}${o.error ? `  (${o.error.slice(0, 100)})` : ''}`);
  }
  const missingNecessary = NECESSARY.filter((k) => !outcomes.find((o) => o.key === k)?.record);
  if (missingNecessary.length) {
    console.error(`\nNecessary sources unavailable with no stored copy: ${missingNecessary.join(', ')}. Nothing was written.`);
    process.exit(1);
  }

  const canonical = canonicalOf(ds, triggers);
  const canonicalText = `${JSON.stringify(canonical, null, 1)}\n`;
  const canonicalPath = join(ROOT, 'canonical.json');
  if (verify && existsSync(canonicalPath)) {
    const before = readFileSync(canonicalPath, 'utf8');
    const same = sha256(before) === sha256(canonicalText);
    console.log(`\nReproducibility check: rebuild is ${same ? 'byte-identical to' : 'DIFFERENT from'} the committed canonical.json (sha256 ${sha256(canonicalText).slice(0, 16)}).`);
    if (!same && offline) { console.error('Offline rebuild differs from committed output. Investigate before publishing.'); process.exit(1); }
  }
  mkdirSync(ROOT, { recursive: true });
  writeFileSync(canonicalPath, canonicalText);

  const evManifest = ds.evidence.map((e) => {
    const req = Object.values(manifest).find((m) => m.sha256 === e.rawResponseHash);
    return { evidenceId: e.evidenceId, label: e.label, value: e.value, unit: e.unit, type: e.observationType, available: e.available, periodStart: e.periodStart, periodEnd: e.periodEnd,
      request: req ? { key: req.key, url: req.url, fetchedAt: req.fetchedAt, sha256: req.sha256 } : null, transform: e.transform, inputs: e.inputs, methodology: e.methodology, notes: e.validationNotes };
  });
  writeFileSync(join(ROOT, 'evidence-manifest.json'), `${JSON.stringify(evManifest, null, 1)}\n`);

  const charts = join(ROOT, 'charts');
  rmSync(charts, { recursive: true, force: true });
  mkdirSync(charts, { recursive: true });
  const charted = ds.evidence.filter((e) => e.series && e.available);
  for (const e of charted) writeFileSync(join(charts, `${e.evidenceId}.json`), `${stableStringify({ evidenceId: e.evidenceId, ...e.series, source: e.sourceName, sourceUrl: e.sourceUrl })}\n`);
  writeFileSync(join(ROOT, 'dashboard.html'), renderDashboard(ds, triggers, manifest));

  const missing: string[] = [];
  const template = readFileSync(join(process.cwd(), 'research', 'THESIS.template.md'), 'utf8');
  writeFileSync(join(process.cwd(), 'THESIS.md'), renderThesis(template, ds.evidence, ds, triggers, missing));

  console.log(`\nWrote canonical.json (${ds.evidence.length} evidence items, ${ds.evidence.filter((e) => e.available).length} available), ${charted.length} chart datasets, dashboard.html and THESIS.md.`);
  console.log(`Window: 90 days ending ${ds.windowEnd}; peer window ends ${ds.peerWindowEnd}.`);
  if (missing.length) console.log(`THESIS.md marks these as unavailable: ${[...new Set(missing)].join(', ')}`);
  console.log(`Verdict: ${ds.thesis.verdict} (${ds.thesis.confidence} confidence). ${ds.thesis.sections.map((x) => `S${x.id} ${x.verdict}`).join(', ')}`);
  for (const t of triggers) console.log(`  ${t.id} ${t.status.padEnd(14)} ${t.observed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
