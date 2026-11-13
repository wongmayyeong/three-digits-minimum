import { describe, expect, it } from 'vitest';
import { speakable } from '@/lib/ai/verify';
import { splitSentences } from '@/lib/debate/engine';
import { mp3Duration } from '@/lib/audio/openai-tts';

describe('spoken text', () => {
  it('drops bracketed evidence IDs and claim codes', () => {
    expect(speakable('It rose to 0.042% [INT-VOL-GROWTH, INT-TAKE-RATE]. On Bear’s XO-1, I concede (TOK-NET-ISSUANCE).'))
      .toBe('It rose to 0.042%. On Bear’s point, I concede.');
  });
  it('keeps decimals whole when splitting sentences', () => {
    expect(splitSentences('Take rate rose from 0.027% to 0.042%. Verdict: Bear wins! Really?')).toEqual(['Take rate rose from 0.027% to 0.042%.', 'Verdict: Bear wins!', 'Really?']);
  });
});

describe('mp3Duration', () => {
  it('sums MPEG-2 Layer III frame durations', () => {
    // 24 kHz, 64 kbps, MPEG-2 Layer III: 192-byte frames of 576 samples (24 ms each).
    const frame = Buffer.alloc(192); frame[0] = 0xff; frame[1] = 0xf3; frame[2] = 0x84; frame[3] = 0xc4;
    expect(mp3Duration(Buffer.concat(Array.from({ length: 50 }, () => frame)))).toBeCloseTo(1.2, 5);
  });
});

describe('clampJudgeOutput', () => {
  it('trims over-long lists and notes so a valid verdict still parses', async () => {
    const { clampJudgeOutput, JudgeOutputSchema } = await import('@/lib/ai/schemas');
    const s = { evidenceAccuracy: 30, methodology: 15, rebuttals: 15, risks: 8, transparency: 8 };
    const raw = { speech: 'Verdict.', scores: { bull: s, bear: s }, scoreNotes: { bull: 'x', bear: 'y' }, winner: 'bear', decisiveEvidenceIds: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      unsupportedClaims: [{ claimId: 'BO-1', reason: 'r'.repeat(400) }], inputChallenges: [], verdictRationale: 'Because.', whatWouldChangeMyMind: ['More deliveries.'], confidenceLabel: 'moderate' };
    expect(JudgeOutputSchema.safeParse(raw).success).toBe(false);
    const out = JudgeOutputSchema.parse(clampJudgeOutput(raw));
    expect(out.decisiveEvidenceIds).toHaveLength(6);
    expect(out.unsupportedClaims[0]!.reason.length).toBeLessThanOrEqual(300);
    expect(out.winner).toBe('bear');
  });
});

describe('alignWords', () => {
  it('times each script character from transcribed words, interpolating words the transcript renders differently', async () => {
    const { alignWords } = await import('@/lib/audio/word-timing');
    const text = 'Bear, look at $20.58 million over ninety-day windows.';
    const words = [
      { word: 'Bear', start: 0.0, end: 0.4 }, { word: 'look', start: 0.6, end: 0.9 }, { word: 'at', start: 0.9, end: 1.0 },
      { word: '$20.58', start: 1.1, end: 1.9 }, { word: 'million', start: 1.9, end: 2.3 }, { word: 'over', start: 2.4, end: 2.6 },
      { word: '90-day', start: 2.6, end: 3.2 }, { word: 'windows', start: 3.3, end: 3.9 },
    ];
    const r = alignWords(text, words, 4.2)!;
    expect(r.alignment.chars.join('')).toBe(text);
    expect(r.alignment.starts).toHaveLength(text.length);
    expect(r.alignment.starts[text.indexOf('million')]).toBeCloseTo(1.9, 5);
    const nd = r.alignment.starts[text.indexOf('ninety')]!;
    expect(nd).toBeGreaterThanOrEqual(2.6 - 1e-9);
    expect(nd).toBeLessThan(3.3);
    for (let i = 1; i < text.length; i++) expect(r.alignment.starts[i]!).toBeGreaterThanOrEqual(r.alignment.starts[i - 1]!);
  });
  it('gives up when the transcript does not match the script', async () => {
    const { alignWords } = await import('@/lib/audio/word-timing');
    expect(alignWords('One two three four.', [{ word: 'banana', start: 0, end: 1 }], 1)).toBeNull();
  });
});
