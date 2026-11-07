import { describe, expect, it } from 'vitest';
import { beatSpans, charAt, claimAt, mouthFor, phraseAt, phrases, timeAtChar } from '@/lib/playback/timeline';
import { snapshotDelta, type DeltaInput } from '@/lib/debate/delta';
import { evaluateTriggers } from '@/lib/research/triggers';

describe('playback timeline', () => {
  const beats = [{ text: 'Volume grew fast.', claimId: 'BO-1' }, { text: 'But fees fell, and capture is small.', claimId: 'BO-2' }];
  const text = beats.map((b) => b.text).join(' ');

  it('maps beats to exact character spans of the canonical text', () => {
    const spans = beatSpans(beats);
    expect(text.slice(spans[1]!.start, spans[1]!.end)).toBe(beats[1]!.text);
    expect(claimAt(spans, 3)).toBe('BO-1');
    expect(claimAt(spans, text.length - 2)).toBe('BO-2');
  });

  it('splits captions at sentence ends', () => {
    const p = phrases(text);
    expect(p[0]!.text).toBe('Volume grew fast.');
    expect(phraseAt(p, text.length - 1)!.text).toMatch(/capture is small/);
  });

  it('uses alignment timestamps as the clock when present, and seeks consistently', () => {
    const chars = text.split('');
    const alignment = { chars, starts: chars.map((_, i) => i * 0.05), ends: chars.map((_, i) => i * 0.05 + 0.05) };
    expect(charAt(1.0, 99, text.length, alignment)).toBe(20);
    expect(timeAtChar(20, 99, text.length, alignment)).toBeCloseTo(1.0);
    // Seeking back and forth returns to the same caption and claim
    const idx = charAt(timeAtChar(30, 0, text.length, alignment), 0, text.length, alignment);
    expect(claimAt(beatSpans(beats), idx)).toBe('BO-2');
  });

  it('falls back to proportional timing without alignment', () => {
    expect(charAt(5, 10, 100, null)).toBe(50);
    expect(charAt(0, 10, 100, null)).toBe(0);
    expect(charAt(99, 10, 100, null)).toBe(99);
  });

  it('closes the mouth on silence and punctuation', () => {
    expect(mouthFor(' ')).toBe('closed');
    expect(mouthFor('.')).toBe('closed');
    expect(mouthFor('a')).toBe('wide');
    expect(mouthFor('o')).toBe('round');
    expect(mouthFor('m')).toBe('closed');
    expect(mouthFor(undefined)).toBe('closed');
  });
});

describe('rematch delta', () => {
  const item = (o: Partial<DeltaInput>): DeltaInput => ({ evidenceId: 'A', label: 'A', value: 100, valueText: null, unit: 'USD', available: true, methodology: 'm', transform: 'sum over 90 days ending 2026-11-04', periodStart: '2026-08-07', periodEnd: '2026-11-04', fetchedAt: '2026-11-05T00:00:00Z', observedAt: null, ...o });

  it('computes absolute and percentage change with matched methodology', () => {
    const [r] = snapshotDelta([item({})], [item({ value: 120, transform: 'sum over 90 days ending 2026-11-11', periodStart: '2026-08-14', periodEnd: '2026-11-11', fetchedAt: '2026-11-12T00:00:00Z' })]);
    expect(r!.kind).toBe('changed');
    expect(r!.absChange).toBe(20);
    expect(r!.pctChange).toBeCloseTo(0.2);
    expect(r!.previousSourceTime).toBe('2026-11-05T00:00:00Z');
  });

  it('suppresses percentage change when methodology differs', () => {
    const [r] = snapshotDelta([item({})], [item({ value: 120, methodology: 'different' })]);
    expect(r!.kind).toBe('not_comparable');
    expect(r!.pctChange).toBeNull();
    expect(r!.warning).toMatch(/suppressed/);
  });

  it('reports new, removed and newly unavailable evidence', () => {
    const rows = snapshotDelta([item({}), item({ evidenceId: 'B' })], [item({ available: false, value: null }), item({ evidenceId: 'C' })]);
    expect(rows.find((r) => r.evidenceId === 'A')!.kind).toBe('became_unavailable');
    expect(rows.find((r) => r.evidenceId === 'B')!.kind).toBe('removed');
    expect(rows.find((r) => r.evidenceId === 'C')!.kind).toBe('new');
  });
});

describe('falsification triggers', () => {
  it('evaluates rules and reports UNKNOWN when inputs are missing', () => {
    const t = evaluateTriggers([
      { evidenceId: 'INT-FEE-RATE', value: 0.001, available: true },
      { evidenceId: 'INT-FEE-RATE-PRIOR', value: 0.002, available: true },
      { evidenceId: 'ACT-DAA-YOY', value: null, available: false },
    ]);
    expect(t.find((x) => x.id === 'F2')!.status).toBe('TRIGGERED');
    expect(t.find((x) => x.id === 'F4')!.status).toBe('UNKNOWN');
  });
});
