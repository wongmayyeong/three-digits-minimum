import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Theatre } from '@/components/theatre/theatre';
import { Container } from '@/components/ui';
import { resolveLlm } from '@/lib/ai/provider';
import { loadDebateView } from '@/lib/debate/view';
import { formatDateTime } from '@/lib/format';
import { validPublicId } from '@/lib/security/http';
import { getTopic } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const v = validPublicId(id, 'd') ? await loadDebateView(id).catch(() => null) : null;
  if (!v) return { title: 'Debate not found' };
  const t = getTopic(v.topicSlug);
  const outcome = v.verdict ? (v.verdict.winner === 'inconclusive' ? 'Inconclusive' : `${v.verdict.winner === 'bull' ? 'Bull' : 'Bear'} wins ${v.verdict.scores.bull.total}-${v.verdict.scores.bear.total}`) : 'In progress';
  return { title: `${t?.shortLabel ?? 'Debate'}: ${outcome}`, description: t?.question, robots: v.synthetic ? { index: false } : undefined };
}

export default async function DebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validPublicId(id, 'd')) notFound();
  const view = await loadDebateView(id);
  if (!view) notFound();
  const topic = getTopic(view.topicSlug)!;
  return (
    <Container className="py-8 md:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/#topics" className="hover:text-fg">Arena</Link> <span aria-hidden="true">/</span>{' '}
        <Link href={`/topics/${topic.slug}`} className="hover:text-fg">{topic.shortLabel}</Link> <span aria-hidden="true">/</span>{' '}
        <span className="text-fg-2">{view.parentId ? 'Rematch' : 'Debate'}</span>
      </nav>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-[600] tracking-[-0.02em] text-balance md:text-[1.875rem]">{topic.question}</h1>
          <p className="mt-2 text-sm text-muted">Started {formatDateTime(view.createdAt)}{view.completedAt ? ` · completed ${formatDateTime(view.completedAt)}` : ''}</p>
        </div>
      </header>
      <Theatre initial={view} llmAvailable={resolveLlm().status.configured} />
    </Container>
  );
}
