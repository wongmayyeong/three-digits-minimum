'use client';

import { useEffect, useState } from 'react';
import { EvidenceChart } from './evidence-chart';
import { EvidenceTable } from './evidence-list';
import { formatDateTime } from '@/lib/format';
import type { TopicPreview } from '@/lib/debate/preview';

/**
 * Evidence availability and preview for a topic. Renders the stored copy immediately, then
 * asks the server to refresh sources that are past their freshness window. The status line
 * reflects the real request; nothing is simulated.
 */
export function TopicLive({ slug, initial }: { slug: string; initial: TopicPreview | null }) {
  const [preview, setPreview] = useState<TopicPreview | null>(initial);
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/topics/${slug}/evidence-preview`, { signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error?.message ?? `HTTP ${r.status}`);
        setPreview(j as TopicPreview);
        setStatus('ok');
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        setStatus('error');
        setError(e.message);
      });
    return () => ctrl.abort();
  }, [slug]);

  const failing = preview?.sources.filter((s) => s.status !== 'OK') ?? [];
  const charted = preview?.items.filter((i) => i.available && i.series && i.series.points.length > 4).slice(0, 2) ?? [];

  return (
    <div className="space-y-10">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Evidence availability</p>
          <p className="text-xs text-muted" aria-live="polite">
            {status === 'checking' && <><span className="nb-live-dot mr-1.5 inline-block size-1.5 rounded-full bg-mint align-middle" aria-hidden="true" />Checking sources for fresher data…</>}
            {status === 'ok' && preview?.newestSourceAt && <>Last refreshed {formatDateTime(preview.newestSourceAt)}</>}
            {status === 'error' && <span className="text-coral">Refresh failed: {error}. Showing stored data.</span>}
          </p>
        </div>
        {preview ? (
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {preview.requirements.map((r) => {
              const full = r.available === r.total;
              const none = r.available === 0;
              return (
                <li key={r.label} className="flex items-start gap-3 text-sm">
                  <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${full ? 'bg-mint' : none ? 'bg-coral' : 'bg-amber'}`} />
                  <span className="flex-1 text-fg-2">{r.label}</span>
                  <span className={`num text-xs ${full ? 'text-fg-2' : 'text-muted'}`}>{r.available}/{r.total}<span className="sr-only"> available</span></span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No stored data yet. Waiting for the first source fetch.</p>
        )}
        {failing.length > 0 && (
          <details className="mt-5 border-t hairline pt-4 text-xs text-muted">
            <summary className="cursor-pointer text-fg-2">{failing.length} source request{failing.length > 1 ? 's' : ''} not available</summary>
            <ul className="mt-2 space-y-1.5">
              {failing.map((f) => <li key={f.key}><span className="num text-faint">{f.key}</span>: {f.error ?? f.status}</li>)}
            </ul>
          </details>
        )}
      </div>

      {charted.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {charted.map((c) => (
            <div key={c.evidenceId} className="panel p-5">
              <p className="text-sm font-[560]">{c.series!.label}</p>
              <p className="num mb-3 text-[0.6875rem] text-faint">{c.evidenceId} · {c.sourceName}</p>
              <EvidenceChart series={c.series!} source={c.sourceName} />
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-[600]">Evidence the debaters will receive</h2>
            <span className="text-xs text-muted"><span className="num">{preview.items.filter((i) => i.available).length}</span> of <span className="num">{preview.items.length}</span> available</span>
          </div>
          <EvidenceTable items={preview.items} />
          <p className="mt-3 text-xs leading-relaxed text-muted">Values here update as sources refresh. When a debate starts, these items are fetched again, hashed and frozen; the debate can only cite the frozen copy.</p>
        </div>
      )}
    </div>
  );
}
