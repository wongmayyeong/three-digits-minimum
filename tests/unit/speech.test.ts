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
