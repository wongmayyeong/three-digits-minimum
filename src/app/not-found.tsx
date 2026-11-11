import Link from 'next/link';
import { Emblem } from '@/components/brand';
import { Container } from '@/components/ui';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
      <Emblem size={64} />
      <p className="eyebrow mt-8">404 · No such record</p>
      <h1 className="display-l mt-3 max-w-2xl text-balance">This page has no evidence behind it.</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-fg-2">The link may be mistyped, or the debate never existed. Debates are never deleted once they complete.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Back to the arena</Link>
        <Link href="/library" className="btn btn-ghost">Browse replays</Link>
      </div>
    </Container>
  );
}
