import Link from 'next/link';
import { AsOf, WinnerLabel } from './ui';
import type { LibraryEntry } from '@/lib/debate/view';

export function LibraryRow({ e }: { e: LibraryEntry }) {
  return (
    <li className="panel relative flex items-center justify-between gap-4 p-5 transition-colors hover:border-line-strong">
      <div className="min-w-0">
        <p className="text-xs text-muted">{e.topicLabel}{e.isRematch ? ' · Rematch' : ''} · <AsOf date={e.completedAt} prefix="" /></p>
        <p className="mt-1.5 text-base"><WinnerLabel winner={e.winner} />{e.scores && <span className="num ml-3 text-sm text-muted">Bull {e.scores.bull} · Bear {e.scores.bear}</span>}</p>
      </div>
      <Link href={`/debates/${e.id}`} className="shrink-0 text-sm font-[560] text-mint after:absolute after:inset-0 after:content-['']">Replay →</Link>
    </li>
  );
}
