'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DebateView } from '@/lib/debate/view';

export interface FetchEvent {
  key: string;
  source: string;
  status: string;
  cacheHit: boolean;
  stale: boolean;
  durationMs: number;
  error: string | null;
}

const TERMINAL = new Set(['COMPLETE', 'FAILED', 'PARTIAL']);

/**
 * Keeps a DebateView current. Primary channel: SSE from the job event log. If the stream
 * errors, falls back to polling. After a terminal status, keeps listening only while audio
 * is still being produced.
 */
export function useDebateLive(initial: DebateView) {
  const [view, setView] = useState<DebateView>(initial);
  const [fetches, setFetches] = useState<FetchEvent[]>([]);
  const [activity, setActivity] = useState<{ phase: string; actor: string } | null>(null);
  const [connection, setConnection] = useState<'live' | 'polling' | 'idle'>('idle');
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastId = useRef<string | null>(initial.lastEventId);

  const refetch = useCallback(async () => {
    try {
      const r = await fetch(`/api/debates/${initial.id}`, { cache: 'no-store' });
      if (r.ok) setView((await r.json()) as DebateView);
    } catch { /* transient; next event or poll retries */ }
  }, [initial.id]);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(refetch, 250);
  }, [refetch]);

  const audioPending = view.turns.some((t) => t.audioStatus === 'PENDING');
  const active = !TERMINAL.has(view.status) || audioPending;

  useEffect(() => {
    if (!active) return;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    const startPolling = () => {
      if (poll || closed) return;
      setConnection('polling');
      poll = setInterval(refetch, 4000);
    };
    try {
      const url = `/api/debates/${initial.id}/events${lastId.current ? `?after=${lastId.current}` : ''}`;
      es = new EventSource(url);
      es.onopen = () => { setConnection('live'); if (poll) { clearInterval(poll); poll = null; } };
      const on = (type: string, fn?: (d: Record<string, unknown>) => void) => es!.addEventListener(type, (ev) => {
        const me = ev as MessageEvent<string>;
        if (me.lastEventId) lastId.current = me.lastEventId;
        let d: Record<string, unknown> = {};
        try { d = JSON.parse(me.data); } catch { /* ignore */ }
        fn?.(d);
        scheduleRefetch();
      });
      on('status');
      on('snapshot');
      on('validation');
      on('model');
      on('verdict');
      on('audio');
      on('turn', () => setActivity(null));
      on('turn_repair');
      on('turn_started', (d) => setActivity({ phase: String(d.phase), actor: String(d.actor) }));
      on('fetch', (d) => setFetches((f) => [...f.filter((x) => x.key !== d.key), d as unknown as FetchEvent]));
      es.addEventListener('end', () => { es?.close(); refetch(); });
      es.onerror = () => { startPolling(); };
    } catch {
      startPolling();
    }
    return () => { closed = true; es?.close(); if (poll) clearInterval(poll); };
  }, [active, initial.id, refetch, scheduleRefetch]);

  return { view, fetches, activity, connection: active ? connection : 'idle', refetch };
}
