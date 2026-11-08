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
import { buildEraRequests, buildRequestCatalog, sha256, stableStringify } from '@/lib/data/sources';
import { evidenceForAgainst } from '@/lib/research/thesis';
import { fileRawStore } from '@/lib/data/stores';
import { buildDataset } from '@/lib/research/evidence';
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
  const era = await fetchAll(buildEraRequests(), store, { offline: offlineMode });
  const eraFetched = era.filter((o) => o.status === 'OK' && !o.cacheHit).length;
  console.log(`  era history: ${era.filter((o) => o.record).length}/${era.length} months available (${eraFetched} fetched now)`);
  const raws = Object.fromEntries([...outcomes, ...era].map((o) => [o.key, o.record]));
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
  const eraRows = t.eras.map((e) => `| ${e.era} | \`${e.account}\` | ${formatValue(e.peak, 'count')} (${e.peakMonth ?? 'n/a'}) | ${formatValue(e.latest, 'count')} (${e.latestMonth ?? 'n/a'}) | ${fmtPct(e.retention)} | ${e.lasted === null ? 'not judgeable yet' : e.lasted ? 'yes' : 'no'} |`);
  const eventRows = t.events.map((v) => `| [${v.label}](${v.source}) | ${v.shown} | ${v.productAccount ? '`' + v.productAccount + '` from ' + v.productLaunchShown : 'no single product contract'} | ${v.eraGrowth === null ? 'n/a' : formatValue(v.eraGrowth, 'ratio')} | ${v.adoptionFollowed === null ? 'N/A, not counted' : v.adoptionFollowed ? 'yes' : 'no'} | ${fmtPct(v.daaChange, true)} | ${fmtPct(v.relativeReturn90, true)} |`);
  template = template
    .replace('{{THESIS_VERDICT}}', VERDICT_TEXT[t.verdict] ?? t.verdict)
    .replace('{{THESIS_CONFIDENCE}}', t.confidence)
    .replace('{{SECTION_TABLE}}', ['| Sub-question | Reading | Why |', '|---|---|---|', ...sectionRows].join(NL))
    .replace('{{EVIDENCE_FOR}}', bullets(fa.forBuilding))
    .replace('{{EVIDENCE_AGAINST}}', bullets(fa.againstBuilding))
    .replace('{{ERA_TABLE}}', ['| Era | Contract | Peak month | Latest month | Kept of peak | Lasted? |', '|---|---|---|---|---|---|', ...eraRows].join(NL))
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
