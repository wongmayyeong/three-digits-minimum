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
import { buildRequestCatalog, sha256, stableStringify } from '@/lib/data/sources';
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
const verify = args.has('--verify') || offline;

async function build(offlineMode: boolean) {
  const store = fileRawStore(RAW);
  const outcomes = await fetchAll(buildRequestCatalog(), store, { offline: offlineMode, forceFresh: !offlineMode });
  const raws = Object.fromEntries(outcomes.map((o) => [o.key, o.record]));
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
  };
}

function renderThesis(template: string, ev: EvidenceDraft[], ds: ReturnType<typeof buildDataset>, triggers: ReturnType<typeof evaluateTriggers>, missing: string[]): string {
  const byId = new Map(ev.map((e) => [e.evidenceId, e]));
  let out = template.replace(/\{\{([A-Z0-9-]+)(?:\.(period|source|type))?\}\}/g, (_, id: string, field?: string) => {
    const e = byId.get(id);
    if (!e) return `[unknown evidence ${id}]`;
    if (field === 'period') return formatPeriod(e.periodStart, e.periodEnd);
    if (field === 'source') return e.sourceName;
    if (field === 'type') return e.observationType;
    if (!e.available) { missing.push(id); return `unavailable (${id})`; }
    return e.valueText ? e.valueText : formatValue(e.value, e.unit);
  });
  const scen = ds.scenarios.map((s) => `| ${s.label} | ${formatValue(s.outputs.annualBuybackDemandUsd, 'USD')} | ${formatValue(s.outputs.buybackDemandToMcap, 'fraction')} | ${formatValue(s.outputs.breakEvenAnnualVolumeUsd, 'USD')} | ${formatValue(s.outputs.volumeMultipleRequired, 'ratio')} | ${s.rationale} |`).join('\n');
  out = out.replace('{{SCENARIO_TABLE}}', `| Scenario | Annual buyback demand | Buyback / market cap | Break-even volume (y = 2%) | Volume multiple | Assumptions |\n|---|---|---|---|---|---|\n${scen}`);
  const fee = ds.feeSensitivity;
  out = out.replace('{{SENSITIVITY_TABLE}}', `| Fee compression \\ target y | ${fee.cols.map((c) => formatValue(c, 'fraction')).join(' | ')} |\n|---|${fee.cols.map(() => '---').join('|')}|\n${fee.rows.map((r, i) => `| ${formatValue(r, 'fraction')} | ${fee.cells[i]!.map((v) => formatValue(v, 'ratio')).join(' | ')} |`).join('\n')}`);
  out = out.replace('{{TRIGGER_TABLE}}', `| ID | Falsification trigger | Rule | Current reading | Status |\n|---|---|---|---|---|\n${triggers.map((t) => `| ${t.id} | ${t.statement} | \`${t.rule}\` | ${t.observed} | **${t.status}** |`).join('\n')}`);
  const register = ev.map((e) => `| ${e.evidenceId} | ${e.label} | ${e.available ? (e.valueText ? 'text' : formatValue(e.value, e.unit)) : 'unavailable'} | ${e.observationType} | ${formatPeriod(e.periodStart, e.periodEnd)} | ${e.sourceName} |`).join('\n');
  out = out.replace('{{EVIDENCE_REGISTER}}', `| ID | Metric | Value | Type | Period | Source |\n|---|---|---|---|---|---|\n${register}`);
  out = out.replace('{{WINDOW_END}}', formatDate(ds.windowEnd)).replace('{{PEER_WINDOW_END}}', formatDate(ds.peerWindowEnd));
  return out;
}

async function main() {
  console.log(offline ? 'Offline rebuild from artifacts/research/raw' : 'Fetching live sources (this takes about a minute; requests are paced per provider)');
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
  for (const t of triggers) console.log(`  ${t.id} ${t.status.padEnd(14)} ${t.observed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
