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
