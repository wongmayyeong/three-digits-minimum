'use client';

import { AnimatePresence, motion } from 'motion/react';
import { TypeBadge } from '@/components/brand';
import { EvidenceChart } from '@/components/evidence-chart';
import { ExternalLink } from '@/components/ui';
import { formatDate, formatDateTime, formatPeriod, formatValue } from '@/lib/format';
import type { ClaimView, EvidenceView, SnapshotView, TurnView, VerdictView } from '@/lib/debate/view';

export function ClaimStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    supported: 'border-[rgb(0_236_151/0.45)] text-mint',
    unsupported: 'border-[rgb(255_121_102/0.55)] text-coral',
    assumption: 'border-[rgb(245_196_81/0.45)] text-amber',
  };
  const label: Record<string, string> = { supported: 'Citations verified', unsupported: 'Unsupported', assumption: 'Assumption' };
  return <span className={`chip ${map[status] ?? ''}`}>{label[status] ?? status}</span>;
}

export function EvidenceCard({ e, tone }: { e: EvidenceView; tone: 'mint' | 'coral' | 'neutral' }) {
  return (
    <div className="rounded-[var(--radius-md)] border hairline bg-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-snug text-fg-2">{e.label}</p>
        <TypeBadge type={e.observationType} />
      </div>
      {e.valueText ? (
        <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted">{e.valueText}</p>
      ) : (
        <p className={`num mt-2 text-[1.75rem] leading-none ${e.available ? 'text-fg' : 'text-muted'}`}>{e.available ? formatValue(e.value, e.unit) : 'Unavailable'}</p>
      )}
      <p className="mt-2 text-xs text-muted">{formatPeriod(e.periodStart, e.periodEnd)}</p>
      {!e.available && e.validationNotes && <p className="mt-1 text-xs text-coral">{e.validationNotes}</p>}
      {e.series && e.series.points.length > 4 && (
        <div className="mt-3"><EvidenceChart series={e.series} source={e.sourceName} method={e.methodology} tone={tone} height={110} compact /></div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t hairline pt-2.5 text-xs">
        <span className="num text-faint">{e.evidenceId}</span>
        <ExternalLink href={e.sourceUrl} className="text-xs">{e.sourceName}</ExternalLink>
      </div>
      <details className="mt-1 text-xs text-muted">
        <summary className="cursor-pointer py-1 text-fg-2">Method and provenance</summary>
        <p className="mt-1 leading-relaxed">{e.methodology}</p>
        <p className="num mt-1.5 break-all text-[0.6875rem] text-faint">Transform: {e.transform}</p>
        {e.rawResponseHash && <p className="num mt-1 break-all text-[0.6875rem] text-faint">Raw SHA-256: {e.rawResponseHash}</p>}
        {e.fetchedAt && <p className="mt-1">Fetched {formatDateTime(e.fetchedAt)}</p>}
      </details>
    </div>
  );
}

export function TurnTray({ turn, claimId, snapshot, allClaims }: { turn: TurnView; claimId: string | null; snapshot: SnapshotView; allClaims: Map<string, ClaimView & { actor: string }> }) {
  const claim = turn.claims.find((c) => c.id === claimId) ?? null;
  const tone = turn.actor === 'bull' ? 'mint' : turn.actor === 'bear' ? 'coral' : 'neutral';
  const ids = claim ? claim.evidenceIds.slice(0, 2) : turn.chartCue ? [turn.chartCue.evidenceId] : [];
  const items = ids.map((id) => snapshot.items.find((i) => i.evidenceId === id)).filter((x): x is EvidenceView => !!x);
  const rebutted = claim?.rebuttedClaimId ? allClaims.get(claim.rebuttedClaimId) : null;
  const fromX = turn.actor === 'bull' ? 60 : -60;
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {rebutted && (
          <motion.div key={`r-${claim!.id}`} initial={{ opacity: 0, x: fromX }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -fromX / 2 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[var(--radius-md)] border border-dashed border-line-strong p-3">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">Answering {rebutted.actor === 'bull' ? 'Bull' : 'Bear'} · <span className="num">{rebutted.id}</span></p>
            <p className="mt-1 text-sm leading-snug text-fg-2 line-through decoration-[rgb(255_255_255/0.25)]">{rebutted.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={claim?.id ?? `cue-${turn.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
          {claim ? (
            <div className="rounded-[var(--radius-md)] border hairline p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-xs text-faint">{claim.id}</span>
                <ClaimStatus status={claim.status} />
                <span className="chip">{claim.nature}</span>
              </div>
              <p className="mt-2 text-[0.9375rem] leading-snug text-fg">{claim.text}</p>
              {claim.problems.length > 0 && <p className="mt-2 text-xs leading-snug text-coral">Audit: {claim.problems.join('; ')}</p>}
            </div>
          ) : (
            <p className="text-xs text-muted">{turn.actor === 'judge' ? 'Decisive evidence' : 'On screen'}</p>
          )}
          {items.map((e) => <EvidenceCard key={e.evidenceId} e={e} tone={tone} />)}
          {!claim && !items.length && <p className="text-sm text-muted">No evidence cue for this passage.</p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function IntroTray({ snapshot, revealIds, progress }: { snapshot: SnapshotView; revealIds: string[]; progress: number }) {
  const items = revealIds.map((id) => snapshot.items.find((i) => i.evidenceId === id)).filter((x): x is EvidenceView => !!x);
  const shown = Math.max(1, Math.ceil(progress * items.length * 1.15));
  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-md)] border hairline p-4">
        <p className="eyebrow">Evidence snapshot frozen</p>
        <p className="mt-2 text-lg">{formatDateTime(snapshot.cutoffAt)}</p>
        <p className="mt-1 text-xs text-muted">Flow metrics: 90 days to {formatDate(snapshot.windowEnd)} · {snapshot.items.filter((i) => i.available).length} of {snapshot.items.length} items available</p>
        <p className="num mt-2 break-all text-[0.6875rem] text-faint">Content hash {snapshot.contentHash.slice(0, 24)}…</p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {items.slice(0, shown).map((e) => (
          <motion.li key={e.evidenceId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-[var(--radius-sm)] border hairline bg-raised p-3">
            <p className="line-clamp-2 text-xs leading-snug text-muted">{e.label}</p>
            <p className="num mt-1.5 text-base text-fg">{formatValue(e.value, e.unit)}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const CATS: { key: keyof VerdictView['scores']['bull']; label: string; max: number }[] = [
  { key: 'evidenceAccuracy', label: 'Evidence accuracy', max: 40 },
  { key: 'methodology', label: 'Methodology', max: 20 },
  { key: 'rebuttals', label: 'Rebuttals', max: 20 },
  { key: 'risks', label: 'Risks and unknowns', max: 10 },
  { key: 'transparency', label: 'Transparency', max: 10 },
];

export function ScoreReveal({ verdict, progress, showVerdict }: { verdict: VerdictView; progress: number; showVerdict: boolean }) {
  const revealed = showVerdict ? CATS.length : Math.min(CATS.length, Math.floor(progress * 1.2 * CATS.length));
  return (
    <div className="rounded-[var(--radius-md)] border hairline p-4">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Scorecard</p>
        <p className="text-[0.6875rem] text-muted">Argument quality, not investment merit</p>
      </div>
      <table className="mt-3 w-full text-sm">
        <thead className="text-xs text-muted"><tr><th scope="col" className="pb-1.5 text-left font-normal">Category</th><th scope="col" className="pb-1.5 text-right font-normal text-mint">Bull</th><th scope="col" className="pb-1.5 text-right font-normal text-coral">Bear</th></tr></thead>
        <tbody>
          {CATS.map((c, i) => (
            <tr key={c.key} className="border-t hairline">
              <th scope="row" className="py-2 text-left font-normal text-fg-2">{c.label} <span className="text-xs text-faint">/{c.max}</span></th>
              {(['bull', 'bear'] as const).map((s) => (
                <td key={s} className="num py-2 text-right">
                  {i < revealed ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{verdict.scores[s][c.key]}</motion.span> : <span className="text-faint">·</span>}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-line-strong">
            <th scope="row" className="py-2 text-left font-[600]">Total <span className="text-xs font-normal text-faint">/100</span></th>
            {(['bull', 'bear'] as const).map((s) => <td key={s} className="num py-2 text-right text-base font-[600]">{showVerdict ? verdict.scores[s].total : <span className="text-faint">·</span>}</td>)}
          </tr>
        </tbody>
      </table>
      <AnimatePresence>
        {showVerdict && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mt-4 border-t hairline pt-4">
            <p className="eyebrow">Verdict</p>
            <p className={`mt-1 text-2xl font-[640] tracking-[-0.02em] ${verdict.winner === 'bull' ? 'text-mint' : verdict.winner === 'bear' ? 'text-coral' : 'text-fg'}`}>
              {verdict.winner === 'inconclusive' ? 'Inconclusive' : `${verdict.winner === 'bull' ? 'Bull' : 'Bear'} wins`}
            </p>
            <p className="mt-1 text-xs text-muted">Judge confidence: {verdict.confidenceLabel}. The argument ends. The evidence remains.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
