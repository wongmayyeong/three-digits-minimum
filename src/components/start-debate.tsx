'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

/** Starts a debate (or rematch). Idempotent: a double-click reuses the same key. */
export function StartDebateButton({ topic, rematchOf, available, unavailableReason, label = 'Start debate', variant = 'primary' }: {
  topic: string; rematchOf?: string; available: boolean; unavailableReason?: string | null; label?: string; variant?: 'primary' | 'ghost';
}) {
  const router = useRouter();
  const key = useRef<string>('');
  const [state, setState] = useState<'idle' | 'starting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (state === 'starting') return;
    if (!key.current) key.current = `k${crypto.randomUUID().replace(/-/g, '').slice(0, 30)}`;
    setState('starting');
    setError(null);
    try {
      const res = await fetch(rematchOf ? `/api/debates/${rematchOf}/rematch` : '/api/debates', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': key.current },
        body: rematchOf ? '{}' : JSON.stringify({ topic }),
      });
      const j = (await res.json()) as { id?: string; url?: string; error?: { message: string; retryAfterSec?: number } };
      if (!res.ok || !j.url) {
        key.current = '';
        setState('error');
        setError(j.error?.message ?? `Request failed (${res.status}).`);
        return;
      }
      router.push(j.url);
    } catch {
      key.current = '';
      setState('error');
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (!available) {
    return (
      <div className="space-y-2">
        <button type="button" className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'}`} aria-disabled="true" disabled>{label}</button>
        <p className="max-w-sm text-xs leading-relaxed text-muted">{unavailableReason ?? 'New debates are unavailable on this deployment.'} Replays still work.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" onClick={start} className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'}`} aria-busy={state === 'starting'}>
        {state === 'starting' ? 'Starting…' : label}
      </button>
      {error && <p role="alert" className="max-w-sm text-xs leading-relaxed text-coral">{error}</p>}
    </div>
  );
}
