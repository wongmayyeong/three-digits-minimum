/**
 * Static research dashboard (artifacts/research/dashboard.html): each chart, the request
 * behind it, and one plain sentence on what it shows. No JavaScript, no external assets.
 */
import type { buildDataset } from '@/lib/research/evidence';
import type { evaluateTriggers } from '@/lib/research/triggers';
import { formatDate, formatValue } from '@/lib/format';
import { chartSentence } from '@/lib/research/caption';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function svgLine(points: [string, number][], unit: string): string {
  const W = 560, H = 180, P = 36;
  const vals = points.map((p) => p[1]);
  const min = Math.min(0, ...vals), max = Math.max(...vals) || 1;
  const x = (i: number) => P + (i / Math.max(1, points.length - 1)) * (W - P - 8);
  const y = (v: number) => H - 22 - ((v - min) / (max - min || 1)) * (H - 40);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)} ${H - 22} L${x(0).toFixed(1)} ${H - 22} Z`;
  const grid = [0, 0.5, 1].map((t) => { const v = min + t * (max - min); return `<line x1="${P}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff14"/><text x="${P - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#949f98">${esc(formatValue(v, unit))}</text>`; }).join('');
  const last = points[points.length - 1]!;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Line chart">${grid}<path d="${area}" fill="#00ec9718"/><path d="${d}" fill="none" stroke="#00ec97" stroke-width="2" stroke-linejoin="round"/><circle cx="${x(points.length - 1)}" cy="${y(last[1])}" r="4" fill="#00ec97" stroke="#0c1210" stroke-width="2"/><text x="${P}" y="${H - 4}" font-size="10" fill="#949f98">${esc(formatDate(points[0]![0]))}</text><text x="${W - 8}" y="${H - 4}" font-size="10" text-anchor="end" fill="#949f98">${esc(formatDate(last[0]))}</text></svg>`;
}

export function renderDashboard(ds: ReturnType<typeof buildDataset>, triggers: ReturnType<typeof evaluateTriggers>, manifest: Record<string, { key: string; url: string; sha256: string; fetchedAt: string }>): string {
  const charted = ds.evidence.filter((e) => e.series && e.available && e.series.points.length > 4);
  const cards = charted.map((e) => {
    const s = e.series!;
    const req = Object.values(manifest).find((m) => m.sha256 === e.rawResponseHash);
    const sentence = chartSentence(s);
    return `<article><h2>${esc(s.label)}</h2><p class="id">${esc(e.evidenceId)} · ${esc(e.sourceName)}</p>${svgLine(s.points, s.unit)}<p>${esc(sentence)}</p><p class="q">Query: GET ${esc(req?.url ?? e.sourceUrl)}<br>Response SHA-256: ${esc(req?.sha256 ?? 'n/a')} · fetched ${esc(req?.fetchedAt ?? 'n/a')}</p><p class="q">Method: ${esc(e.methodology)}</p></article>`;
  }).join('\n');
  const trig = triggers.map((t) => `<tr><td>${t.id}</td><td>${esc(t.statement)}</td><td><code>${esc(t.rule)}</code></td><td>${esc(t.observed)}</td><td class="${t.status === 'TRIGGERED' ? 'bad' : t.status === 'UNKNOWN' ? 'unk' : 'ok'}">${t.status}</td></tr>`).join('');
  const base = ds.scenarios.find((s) => s.key === 'base');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Is NEAR Building the Future or Following the Hype? Research dashboard</title>
<style>
:root{color-scheme:dark}body{margin:0;background:#060a08;color:#f2f1e9;font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1180px;margin:0 auto;padding:40px 20px}h1{font-size:40px;letter-spacing:-.02em;margin:0 0 8px}h2{font-size:16px;margin:0}
.lead{color:#c9cdc5;max-width:760px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;margin-top:28px}
article{background:#0c1210;border:1px solid #ffffff17;border-radius:10px;padding:18px}.id,.q{color:#949f98;font:12px/1.5 ui-monospace,monospace;word-break:break-all}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}td,th{border-top:1px solid #ffffff17;padding:8px;text-align:left;vertical-align:top}
.bad{color:#ff7966}.ok{color:#00ec97}.unk{color:#f5c451}code{font-size:12px;color:#c9cdc5}
</style></head><body><main>
<h1>Is NEAR Building the Future or Following the Hype?</h1><p class="lead">Research dashboard: every chart, the query behind it, and one plain sentence on what it shows.</p>
<p class="lead">Every chart below is rebuilt from raw provider responses by <code>npm run research:refresh</code> (live) or <code>npm run research:rebuild</code> (offline, from <code>artifacts/research/raw</code>). Flow metrics use the 90 days ending ${esc(formatDate(ds.windowEnd))}; peer comparisons use the 30 days ending ${esc(formatDate(ds.peerWindowEnd))}. Educational research, not financial advice.</p>
${base ? `<p class="lead">Base case of the break-even model: annual buyback demand ${esc(formatValue(base.outputs.annualBuybackDemandUsd, 'USD'))} (${esc(formatValue(base.outputs.buybackDemandToMcap, 'fraction'))} of market cap). Reaching a hypothetical 2% would need ${esc(formatValue(base.outputs.volumeMultipleRequired, 'ratio'))} today's volume run rate.</p>` : ''}
<div class="grid">${cards}</div>
<h2 style="margin-top:40px;font-size:22px">Falsification triggers</h2>
<table><thead><tr><th>ID</th><th>Trigger</th><th>Rule</th><th>Current reading</th><th>Status</th></tr></thead><tbody>${trig}</tbody></table>
</main></body></html>
`;
}
