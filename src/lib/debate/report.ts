/**
 * Investment Thesis Report: a deterministic assembly of stored debate content, the frozen
 * evidence register and model outputs. No new generation happens here.
 */
import { formatDate, formatDateTime, formatPeriod, formatValue } from '@/lib/format';
import { getTopic } from '@/lib/topics/topics';
import type { DebateView, EvidenceView, SnapshotView } from './view';

export interface ThesisReport {
  id: string;
  topic: { slug: string; label: string; question: string; bullHypothesis: string; bearHypothesis: string };
  generatedFrom: { snapshotId: string; contentHash: string; cutoffAt: string; windowEnd: string | null; methodologyVersion: string; formulaVersion: string | null; aiModel: string; promptVersion: string; synthetic: boolean };
  verdict: DebateView['verdict'];
  support: { claimId: string; text: string; evidenceIds: string[]; status: string; nature: string }[];
  counter: { claimId: string; text: string; evidenceIds: string[]; status: string; nature: string }[];
  evidenceRegister: { evidenceId: string; label: string; display: string; type: string; classification: 'SUPPORTED' | 'CONTRADICTED' | 'UNKNOWN' | 'ASSUMPTION' | 'CONTEXT'; period: string; source: string; sourceUrl: string; hash: string | null }[];
  assumptions: { input: string; value: string; kind: string; note: string }[];
  scenarios: SnapshotView['scenarios'];
  unknowns: { evidenceId: string; label: string; reason: string }[];
  falsification: string[];
  methodology: string[];
}

function classify(e: EvidenceView, bullIds: Set<string>, bearIds: Set<string>): ThesisReport['evidenceRegister'][number]['classification'] {
  if (!e.available) return 'UNKNOWN';
  if (e.observationType === 'ASSUMED') return 'ASSUMPTION';
  const b = bullIds.has(e.evidenceId);
  const x = bearIds.has(e.evidenceId);
  if (b && !x) return 'SUPPORTED';
  if (x && !b) return 'CONTRADICTED';
  return 'CONTEXT';
}

export function buildReport(v: DebateView): ThesisReport | null {
  const topic = getTopic(v.topicSlug);
  if (!topic || !v.snapshot) return null;
  const claims = v.turns.filter((t) => t.actor !== 'judge').flatMap((t) => t.claims.map((c) => ({ ...c, actor: t.actor })));
  const supported = (c: { status: string }) => c.status !== 'unsupported';
  const bullIds = new Set(claims.filter((c) => c.actor === 'bull' && supported(c)).flatMap((c) => c.evidenceIds));
  const bearIds = new Set(claims.filter((c) => c.actor === 'bear' && supported(c)).flatMap((c) => c.evidenceIds));
  const base = v.snapshot.modelBase;
  const labels: Record<string, string> = { M: 'Market cap (M)', V: 'Annualized Intents volume (V)', f: 'Effective fee rate (f)', c: 'Protocol capture (c)', b: 'Buyback share (b)', y: 'Target buyback / market cap (y)' };
  return {
    id: v.id,
    topic: { slug: topic.slug, label: topic.shortLabel, question: topic.question, bullHypothesis: topic.bullHypothesis, bearHypothesis: topic.bearHypothesis },
    generatedFrom: {
      snapshotId: v.snapshot.id, contentHash: v.snapshot.contentHash, cutoffAt: v.snapshot.cutoffAt, windowEnd: v.snapshot.windowEnd,
      methodologyVersion: v.snapshot.methodologyVersion, formulaVersion: v.snapshot.formulaVersion, aiModel: v.aiModel, promptVersion: v.promptVersion, synthetic: v.synthetic,
    },
    verdict: v.verdict,
    support: claims.filter((c) => c.actor === 'bull').map((c) => ({ claimId: c.id, text: c.text, evidenceIds: c.evidenceIds, status: c.status, nature: c.nature })),
    counter: claims.filter((c) => c.actor === 'bear').map((c) => ({ claimId: c.id, text: c.text, evidenceIds: c.evidenceIds, status: c.status, nature: c.nature })),
    evidenceRegister: v.snapshot.items.map((e) => ({
      evidenceId: e.evidenceId, label: e.label, display: e.valueText ? 'text' : formatValue(e.value, e.unit), type: e.observationType,
      classification: classify(e, bullIds, bearIds), period: formatPeriod(e.periodStart, e.periodEnd), source: e.sourceName, sourceUrl: e.sourceUrl, hash: e.rawResponseHash,
    })),
    assumptions: base ? Object.entries(base).map(([k, inp]) => ({
      input: labels[k] ?? k, value: inp.value === null ? 'N/A' : k === 'M' || k === 'V' ? formatValue(inp.value, 'USD') : formatValue(inp.value, 'fraction'),
      kind: inp.kind, note: inp.note ?? (inp.evidenceIds.length ? `From ${inp.evidenceIds.join(', ')}` : ''),
    })) : [],
    scenarios: v.snapshot.scenarios,
    unknowns: v.snapshot.items.filter((e) => !e.available).map((e) => ({ evidenceId: e.evidenceId, label: e.label, reason: e.validationNotes ?? 'Unavailable at snapshot time.' })),
    falsification: v.verdict?.whatWouldChangeMyMind ?? [],
    methodology: [
      `Evidence was fetched from public sources and frozen in snapshot ${v.snapshot.id} at ${formatDateTime(v.snapshot.cutoffAt)}; flow metrics use the 90-day window ending ${formatDate(v.snapshot.windowEnd)}.`,
      'Every derived figure is computed by deterministic server code from stored responses (SHA-256 hashes listed in the register). The AI agents could only cite this snapshot.',
      'A server audit checked every cited evidence ID and every spoken number. Unsupported claims are flagged and penalized in the Judge\'s evidence-accuracy score.',
      'Scores rate argument quality against the evidence. They are not an investment rating, a price forecast or a probability of profit. Some rubric dimensions are the AI Judge\'s subjective assessment.',
      'Educational research only. Not financial advice.',
    ],
  };
}

export function reportMarkdown(r: ThesisReport): string {
  const L: string[] = [];
  L.push(`# NEBUBE Investment Thesis Report: ${r.topic.label}`, '');
  if (r.generatedFrom.synthetic) L.push('> SYNTHETIC TEST RUN. Generated by a fixed template, not an AI model. Not a research result.', '');
  L.push(`**Question.** ${r.topic.question}`, '', `**Bull hypothesis.** ${r.topic.bullHypothesis}`, '', `**Bear hypothesis.** ${r.topic.bearHypothesis}`, '');
  if (r.verdict) {
    L.push(`## Verdict: ${r.verdict.winner.toUpperCase()} (confidence: ${r.verdict.confidenceLabel})`, '', r.verdict.verdictRationale, '');
    L.push(`| | Evidence (40) | Method (20) | Rebuttals (20) | Risks (10) | Transparency (10) | Total |`, '|---|---|---|---|---|---|---|');
    for (const s of ['bull', 'bear'] as const) {
      const x = r.verdict.scores[s];
      L.push(`| ${s} | ${x.evidenceAccuracy} | ${x.methodology} | ${x.rebuttals} | ${x.risks} | ${x.transparency} | **${x.total}** |`);
    }
    L.push('', '_Debate argument scores, not an investment rating. Evidence scores include deterministic penalties for unsupported citations._', '');
    if (r.verdict.overrideReason) L.push(`> Server override: ${r.verdict.overrideReason}`, '');
  }
  L.push('## Supporting arguments (Bull)', '', ...r.support.map((c) => `- **${c.claimId}** (${c.nature}, ${c.status}) ${c.text} [${c.evidenceIds.join(', ')}]`), '');
  L.push('## Counterarguments (Bear)', '', ...r.counter.map((c) => `- **${c.claimId}** (${c.nature}, ${c.status}) ${c.text} [${c.evidenceIds.join(', ')}]`), '');
  if (r.assumptions.length) {
    L.push('## Model inputs and assumptions', '', '| Input | Value | Kind | Note |', '|---|---|---|---|', ...r.assumptions.map((a) => `| ${a.input} | ${a.value} | ${a.kind} | ${a.note} |`), '');
    L.push('## Scenario sensitivity', '', '| Scenario | Annual buyback demand | Buyback / market cap | Volume multiple for 2% |', '|---|---|---|---|');
    for (const s of r.scenarios) {
      const o = s.outputs as Record<string, number | null>;
      L.push(`| ${s.label} | ${formatValue(o.annualBuybackDemandUsd ?? null, 'USD')} | ${formatValue(o.buybackDemandToMcap ?? null, 'fraction')} | ${formatValue(o.volumeMultipleRequired ?? null, 'ratio')} |`);
    }
    L.push('', '_A buyback is not a burn, and buyback demand does not translate one-for-one into price._', '');
  }
  if (r.verdict?.inputChallenges.length) L.push('## Judge challenges to model inputs', '', ...r.verdict.inputChallenges.map((c) => `- **${c.input}**: ${c.challenge}`), '');
  L.push('## Falsification triggers', '', ...r.falsification.map((f) => `- ${f}`), '');
  L.push('## Unknowns and data limitations', '', ...(r.unknowns.length ? r.unknowns.map((u) => `- **${u.evidenceId}** ${u.label}: ${u.reason}`) : ['- None at snapshot time.']), '');
  L.push('## Evidence register', '', '| ID | Metric | Value | Type | Classification | Period | Source |', '|---|---|---|---|---|---|---|');
  for (const e of r.evidenceRegister) L.push(`| ${e.evidenceId} | ${e.label} | ${e.display} | ${e.type} | ${e.classification} | ${e.period} | [${e.source}](${e.sourceUrl}) |`);
  L.push('', '## Methodology', '', ...r.methodology.map((m) => `- ${m}`), '', `Snapshot ${r.generatedFrom.snapshotId}, content hash \`${r.generatedFrom.contentHash}\`. Model: ${r.generatedFrom.aiModel}. Prompts: ${r.generatedFrom.promptVersion}. Formula: ${r.generatedFrom.formulaVersion ?? 'n/a'}.`, '');
  return L.join('\n');
}
