'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StartDebateButton } from '@/components/start-debate';
import { ExternalLink, Notice } from '@/components/ui';
import { STATUS_LABEL, STATUS_ORDER, type DebateStatus } from '@/lib/debate/phases';
import { formatDateTime, formatValue } from '@/lib/format';
import type { DeltaRow } from '@/lib/debate/delta';
import type { DebateView, SnapshotView, TurnView } from '@/lib/debate/view';
import type { FetchEvent } from './use-debate-live';
import { ClaimStatus } from './tray';

const PHASE_TITLE: Record<string, string> = {
  BULL_OPEN: 'Bull · Opening', BEAR_OPEN: 'Bear · Opening', BULL_REBUTTAL: 'Bull · Rebuttal', BEAR_REBUTTAL: 'Bear · Rebuttal',
  BULL_CLOSE: 'Bull · Closing', BEAR_CLOSE: 'Bear · Closing', JUDGING: 'Judge · Verdict',
};

export function ResearchProgress({ view, fetches, activity }: { view: DebateView; fetches: FetchEvent[]; activity: { phase: string; actor: string } | null }) {
  const statusIdx = STATUS_ORDER.indexOf(view.status as DebateStatus);
  const steps: DebateStatus[] = ['FETCHING', 'VALIDATING', 'MODELING'];
  const sources = view.snapshot?.sources.map((s) => ({ key: s.key, status: s.status, cacheHit: s.cacheHit, stale: s.stale, error: s.error })) ?? fetches.map((f) => ({ key: f.key, status: f.status, cacheHit: f.cacheHit, stale: f.stale, error: f.error }));
  const ok = sources.filter((s) => s.status === 'OK').length;
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {steps.map((s) => {
          const i = STATUS_ORDER.indexOf(s);
          const done = statusIdx > i;
          const now = statusIdx === i;
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span aria-hidden="true" className={`size-2 rounded-full ${done ? 'bg-mint' : now ? 'nb-live-dot bg-mint' : 'bg-line-strong'}`} />
              <span className={done || now ? 'text-fg' : 'text-muted'}>{STATUS_LABEL[s]}</span>
              {s === 'FETCHING' && sources.length > 0 && <span className="num ml-auto text-xs text-muted">{ok}/{sources.length} sources</span>}
            </li>
          );
        })}
      </ol>
      {sources.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-auto rounded-[var(--radius-sm)] border hairline p-2.5 text-xs">
          {sources.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${s.status === 'OK' ? (s.stale ? 'bg-amber' : 'bg-mint') : s.status === 'UNCONFIGURED' ? 'bg-line-strong' : 'bg-coral'}`} />
              <span className="num truncate text-fg-2">{s.key}</span>
              <span className="ml-auto shrink-0 text-muted">{s.status === 'OK' ? (s.stale ? 'stale copy' : s.cacheHit ? 'cached' : 'fetched') : s.status === 'UNCONFIGURED' ? 'not configured' : 'failed'}</span>
            </li>
          ))}
        </ul>
      )}
      {activity && <p className="text-sm text-fg-2" aria-live="polite"><span className="nb-live-dot mr-2 inline-block size-1.5 rounded-full bg-mint align-middle" aria-hidden="true" />{PHASE_TITLE[activity.phase] ?? activity.phase}: drafting and passing the citation audit…</p>}
    </div>
  );
}

export function Transcript({ turns, onJump, activeIndex }: { turns: TurnView[]; onJump: (seq: number) => void; activeIndex: number }) {
  return (
    <ol className="space-y-6">
      {turns.map((t) => (
        <li key={t.id} className={`border-l-2 pl-4 ${t.actor === 'bull' ? 'border-mint' : t.actor === 'bear' ? 'border-coral' : 'border-fg-2'} ${activeIndex === t.seq ? '' : 'opacity-90'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-[600]">{PHASE_TITLE[t.phase] ?? t.phase}</h3>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="num">{t.audit.wordCount} words</span>
              <button type="button" className="link text-xs" onClick={() => onJump(t.seq)}>Play from here</button>
            </div>
          </div>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-2">{t.speechText}</p>
          {t.claims.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {t.claims.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline gap-2 text-xs">
                  <span className="num text-faint">{c.id}</span>
                  <ClaimStatus status={c.status} />
                  <span className="text-muted">{c.text}</span>
                  <span className="num text-faint">[{c.evidenceIds.join(', ') || 'no citation'}]</span>
                </li>
              ))}
            </ul>
          )}
          {t.audit.unverifiedNumbers?.length > 0 && <p className="mt-2 text-xs text-coral">Numbers not matched to the snapshot: {t.audit.unverifiedNumbers.join(', ')}</p>}
        </li>
      ))}
    </ol>
  );
}

export function VerdictDetails({ view }: { view: DebateView }) {
  const v = view.verdict!;
  const snap = view.snapshot!;
  const label = (id: string) => snap.items.find((i) => i.evidenceId === id);
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Rationale</p>
        <p className="mt-2 leading-relaxed text-fg-2">{v.verdictRationale}</p>
        {v.overrideReason && <div className="mt-3"><Notice tone="warn" title="Server audit changed the outcome">{v.overrideReason} The Judge originally picked: {v.llmWinner}.</Notice></div>}
      </div>
      {v.decisiveEvidenceIds.length > 0 && (
        <div>
          <p className="eyebrow">Decisive evidence</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {v.decisiveEvidenceIds.map((id) => {
              const e = label(id);
              return <li key={id} className="flex flex-wrap items-baseline gap-2"><span className="num text-xs text-faint">{id}</span>{e ? <><span className="text-fg-2">{e.label}</span><span className="num">{formatValue(e.value, e.unit)}</span><ExternalLink href={e.sourceUrl} className="text-xs">{e.sourceName}</ExternalLink></> : null}</li>;
            })}
          </ul>
        </div>
      )}
      {v.inputChallenges.length > 0 && (
        <div>
          <p className="eyebrow">Challenges to model inputs</p>
          <ul className="mt-2 space-y-2 text-sm">{v.inputChallenges.map((c, i) => <li key={i}><span className="num mr-2 text-mint">{c.input}</span><span className="text-fg-2">{c.challenge}</span></li>)}</ul>
        </div>
      )}
      <div>
        <p className="eyebrow">What would change the Judge&apos;s mind</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-fg-2">{v.whatWouldChangeMyMind.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </div>
      <div>
        <p className="eyebrow">Unsupported claims</p>
        {v.unsupportedClaims.length ? (
          <ul className="mt-2 space-y-1.5 text-sm">{v.unsupportedClaims.map((u) => <li key={u.claimId}><span className="num mr-2 text-coral">{u.claimId}</span><span className="text-fg-2">{u.reason}</span> <span className="text-xs text-faint">({u.source === 'server' ? 'server audit' : 'Judge'})</span></li>)}</ul>
        ) : <p className="mt-2 text-sm text-muted">None. Every claim cited available evidence.</p>}
        {v.penalties.some((p) => p.points > 0) && (
          <p className="mt-2 text-xs text-muted">Deterministic penalties to evidence accuracy: {v.penalties.map((p) => `${p.side} −${p.points}`).join(', ')} (4 per unsupported claim, 2 per unmatched number, 3 per invalid citation).</p>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted">Scores are the AI Judge&apos;s assessment of argument quality against the evidence (model {v.model}), adjusted by deterministic citation penalties. They are not an investment rating or a probability of profit.</p>
    </div>
  );
}

export function SnapshotPanel({ snapshot }: { snapshot: SnapshotView }) {
  const failing = snapshot.sources.filter((s) => s.status !== 'OK' || s.stale);
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <dt className="text-muted">Snapshot</dt><dd className="num break-all">{snapshot.id}</dd>
        <dt className="text-muted">Frozen</dt><dd>{formatDateTime(snapshot.cutoffAt)}</dd>
        <dt className="text-muted">Content hash</dt><dd className="num break-all text-faint">{snapshot.contentHash}</dd>
        <dt className="text-muted">Methodology</dt><dd className="num">{snapshot.methodologyVersion}{snapshot.formulaVersion ? ` · ${snapshot.formulaVersion}` : ''}</dd>
        <dt className="text-muted">Sources</dt><dd>{snapshot.sources.filter((s) => s.status === 'OK').length} of {snapshot.sources.length} requests succeeded</dd>
      </dl>
      {failing.length > 0 && (
        <ul className="space-y-1 text-xs text-muted">{failing.map((f) => <li key={f.key}><span className="num text-faint">{f.key}</span>: {f.stale ? 'stale stored copy used' : f.status === 'UNCONFIGURED' ? 'not configured' : 'unavailable'}{f.error ? ` (${f.error.slice(0, 120)})` : ''}</li>)}</ul>
      )}
    </div>
  );
}

export function DeltaPanel({ debateId }: { debateId: string }) {
  const [rows, setRows] = useState<DeltaRow[] | null>(null);
  const [meta, setMeta] = useState<{ previous: { debateId: string; cutoffAt: string }; current: { cutoffAt: string } } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/debates/${debateId}/delta`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message ?? `HTTP ${r.status}`);
      setRows(j.rows); setMeta(j);
    }).catch((e: Error) => setErr(e.message));
  }, [debateId]);
  if (err) return <p className="text-sm text-muted">{err}</p>;
  if (!rows || !meta) return <p className="text-sm text-muted">Loading comparison…</p>;
  const changed = rows.filter((r) => r.kind !== 'unchanged');
  return (
    <div>
      <p className="text-sm text-fg-2">Compared with <Link className="link" href={`/debates/${meta.previous.debateId}`}>the original debate</Link> (snapshot {formatDateTime(meta.previous.cutoffAt)} → {formatDateTime(meta.current.cutoffAt)}). {changed.length} of {rows.length} items changed. The original replay is untouched.</p>
      <div className="mt-3 max-h-[420px] overflow-auto rounded-[var(--radius-md)] border hairline">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="sticky top-0 bg-raised text-muted"><tr><th className="px-3 py-2 font-normal">Evidence</th><th className="px-3 py-2 text-right font-normal">Previous</th><th className="px-3 py-2 text-right font-normal">New</th><th className="px-3 py-2 text-right font-normal">Change</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.evidenceId} className="border-t hairline align-top">
                <td className="px-3 py-2"><p className="text-fg-2">{r.label}</p><p className="num text-faint">{r.evidenceId}</p>{r.warning && <p className="mt-0.5 text-amber">{r.warning}</p>}</td>
                <td className="num px-3 py-2 text-right text-muted">{formatValue(r.previous, r.unit)}</td>
                <td className="num px-3 py-2 text-right">{formatValue(r.current, r.unit)}</td>
                <td className="num px-3 py-2 text-right">
                  {r.kind === 'changed' && r.pctChange !== null ? <span>{formatValue(r.pctChange, 'fraction', { signed: true })}</span>
                    : r.kind === 'unchanged' ? <span className="text-faint">unchanged</span>
                      : <span className="text-amber">{r.kind.replace(/_/g, ' ')}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FailurePanel({ view, onRetried }: { view: DebateView; onRetried: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function retry() {
    setBusy(true);
    setMsg(null);
    const r = await fetch(`/api/debates/${view.id}/retry`, { method: 'POST' }).catch(() => null);
    setBusy(false);
    if (!r) { setMsg('Could not reach the server.'); return; }
    if (!r.ok) { const j = await r.json().catch(() => null); setMsg(j?.error?.message ?? `Retry failed (${r.status}).`); return; }
    onRetried();
  }
  return (
    <Notice tone="error" title={view.status === 'PARTIAL' ? `The debate stopped at: ${STATUS_LABEL[view.failedAtStatus as DebateStatus] ?? view.failedAtStatus}` : 'The debate could not start'}>
      <p>{view.failureReason}</p>
      <p className="mt-1">{view.status === 'PARTIAL' ? 'Completed turns are saved and playable. Retrying continues from the failed step without regenerating them.' : 'No turns were generated.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={retry} className="btn btn-ghost" disabled={busy}>{busy ? 'Retrying…' : 'Retry from the failed step'}</button>
        <StartDebateButton topic={view.topicSlug} available label="Start a new debate" variant="ghost" />
      </div>
      {msg && <p role="alert" className="mt-2 text-coral">{msg}</p>}
    </Notice>
  );
}
