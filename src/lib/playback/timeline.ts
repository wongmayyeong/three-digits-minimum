/**
 * Pure playback math shared by the theatre and tests. The playback clock (audio currentTime,
 * or a virtual clock in caption mode) maps to a character position in the canonical
 * speechText; captions, evidence cues and mouth shapes all derive from that one position,
 * so they cannot drift apart.
 */

export type MouthShape = 'closed' | 'small' | 'wide' | 'round' | 'smile' | 'frown';

export interface Alignment {
  chars: string[];
  starts: number[];
  ends: number[];
}

export interface Phrase {
  start: number;
  end: number;
  text: string;
}

export interface BeatSpan {
  start: number;
  end: number;
  claimId: string | null;
}

/** Splits speech into caption phrases of at most `maxWords`, preferring punctuation breaks. */
export function phrases(text: string, maxWords = 13): Phrase[] {
  const out: Phrase[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  let words: { s: number; e: number; w: string }[] = [];
  const flush = () => {
    if (!words.length) return;
    const s = words[0]!.s;
    const e = words[words.length - 1]!.e;
    out.push({ start: s, end: e, text: text.slice(s, e) });
    words = [];
  };
  while ((m = re.exec(text))) {
    words.push({ s: m.index, e: m.index + m[0].length, w: m[0] });
    const strong = /[.!?]["')\]]?$/.test(m[0]);
    const soft = /[,;:]$|—$/.test(m[0]);
    if (strong || words.length >= maxWords || (soft && words.length >= 7)) flush();
  }
  flush();
  return out;
}

/** Character spans of each beat inside the joined speechText (beats are joined with one space). */
export function beatSpans(beats: { text: string; claimId: string | null }[]): BeatSpan[] {
  const spans: BeatSpan[] = [];
  let pos = 0;
  for (const b of beats) {
    const t = b.text.trim();
    spans.push({ start: pos, end: pos + t.length, claimId: b.claimId });
    pos += t.length + 1;
  }
  return spans;
}

/** Speaking duration estimate for caption-only playback (seconds at 1x). */
export function estimateDuration(text: string, wordsPerSecond = 2.7): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4, words / wordsPerSecond + 0.6);
}

/** Character index being spoken at time t. Alignment when available, proportional otherwise. */
export function charAt(t: number, duration: number, textLength: number, alignment: Alignment | null): number {
  if (textLength <= 0) return 0;
  if (alignment && alignment.starts.length) {
    const s = alignment.starts;
    let lo = 0;
    let hi = s.length - 1;
    if (t <= s[0]!) return 0;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s[mid]! <= t) lo = mid;
      else hi = mid - 1;
    }
    // Alignment length can differ slightly from text length when the provider normalizes.
    return Math.min(textLength - 1, Math.round((lo / Math.max(1, s.length - 1)) * (textLength - 1)));
  }
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(textLength - 1, Math.floor((t / duration) * textLength)));
}

/** Inverse of charAt: the time at which a character index is spoken. */
export function timeAtChar(idx: number, duration: number, textLength: number, alignment: Alignment | null): number {
  if (alignment && alignment.starts.length) {
    const i = Math.round((idx / Math.max(1, textLength - 1)) * (alignment.starts.length - 1));
    return alignment.starts[Math.max(0, Math.min(alignment.starts.length - 1, i))]!;
  }
  return textLength > 0 ? (idx / textLength) * duration : 0;
}

export function phraseAt(list: Phrase[], idx: number): Phrase | null {
  for (const p of list) if (idx <= p.end) return p;
  return list[list.length - 1] ?? null;
}

export function claimAt(spans: BeatSpan[], idx: number): string | null {
  for (const s of spans) if (idx <= s.end) return s.claimId;
  return null;
}

/**
 * Approximate mouth shape for the character being spoken. With ElevenLabs character
 * timestamps this is a phoneme approximation, not true visemes, and is labelled as such.
 */
export function mouthFor(ch: string | undefined): MouthShape {
  if (!ch) return 'closed';
  const c = ch.toLowerCase();
  if (/[aæ]/.test(c)) return 'wide';
  if (/[eiy]/.test(c)) return 'small';
  if (/[ouw]/.test(c)) return 'round';
  if (/[mbp]/.test(c)) return 'closed';
  if (/[a-z0-9$%]/.test(c)) return 'small';
  return 'closed';
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
