'use client';

import Link from 'next/link';
import { Emblem } from '@/components/brand';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] flex-col items-start justify-center px-4 py-20 sm:px-6">
      <Emblem size={64} />
      <p className="eyebrow mt-8">Something failed on our side</p>
      <h1 className="display-l mt-3 max-w-2xl text-balance">The arena could not load this page.</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-fg-2">
        Usually this means the database or a data source did not answer in time. Stored debates and snapshots are safe. Try again in a moment.
      </p>
      {error.digest && <p className="num mt-3 text-xs text-faint">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/" className="btn btn-ghost">Back to the arena</Link>
      </div>
    </div>
  );
}
