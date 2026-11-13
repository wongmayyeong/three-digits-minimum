/**
 * Caption timing for providers that return audio without timestamps (OpenAI text-to-speech).
 *
 * The generated clip is transcribed once with word-level timestamps (whisper-1), and the transcribed words are
 * aligned to the exact script by dynamic programming. Only the timing is taken from the transcript: the caption
 * text is always the canonical speechText. Words the transcript misses or renders differently ("ninety-day" vs
 * "90-day") get times interpolated from their matched neighbours. The result is a per-character alignment in the
 * same shape ElevenLabs returns, so playback treats both providers the same way.
 */

export interface TimedWord { word: string; start: number; end: number }
export interface CharAlignment { chars: string[]; starts: number[]; ends: number[] }

const norm = (w: string) => w.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
const same = (a: string, b: string) => !!a && !!b && (a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))));

/** Builds a per-character alignment of `text` from transcribed word timings. Returns null when too little matches. */
export function alignWords(text: string, words: TimedWord[], durationSec: number): { alignment: CharAlignment; matchedShare: number } | null {
  const tokens = [...text.matchAll(/\S+/g)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, n: norm(m[0]) }));
  const heard = words.map((w) => ({ ...w, n: norm(w.word) })).filter((w) => w.n);
  if (!tokens.length || !heard.length) return null;

  // Longest common subsequence over normalized words.
  const n = tokens.length, m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i]![j] = same(tokens[i]!.n, heard[j]!.n) ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  }
  const t0: (number | null)[] = Array(n).fill(null), t1: (number | null)[] = Array(n).fill(null);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (same(tokens[i]!.n, heard[j]!.n) && dp[i]![j] === dp[i + 1]![j + 1]! + 1) { t0[i] = heard[j]!.start; t1[i] = heard[j]!.end; i++; j++; }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
    else j++;
  }
  const matched = t0.filter((x) => x !== null).length;
  const scorable = tokens.filter((t) => t.n).length || 1;
  if (matched / scorable < 0.5) return null;

  // Interpolate unmatched tokens between matched neighbours, in proportion to their length.
  const end = Math.max(durationSec, heard[heard.length - 1]!.end);
  for (let i = 0; i < n;) {
    if (t0[i] !== null) { i++; continue; }
    let k = i; while (k < n && t0[k] === null) k++;
    const from = i > 0 ? t1[i - 1]! : 0, to = k < n ? t0[k]! : end;
    const lens = tokens.slice(i, k).map((t) => t.end - t.start + 1), total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    for (let q = i; q < k; q++) { const a = from + ((to - from) * acc) / total; acc += lens[q - i]!; t0[q] = a; t1[q] = from + ((to - from) * acc) / total; }
    i = k;
  }

  // Per-character times: linear within each word; gaps take the next word's start. Kept non-decreasing.
  const chars = text.split('');
  const starts = new Array<number>(chars.length), ends = new Array<number>(chars.length);
  let ti = 0;
  for (let c = 0; c < chars.length; c++) {
    while (ti < n && tokens[ti]!.end <= c) ti++;
    const tok = tokens[ti];
    if (tok && c >= tok.start) {
      const a = t0[ti]!, b = Math.max(a, t1[ti]!), len = tok.end - tok.start;
      starts[c] = a + ((b - a) * (c - tok.start)) / len;
      ends[c] = a + ((b - a) * (c - tok.start + 1)) / len;
    } else {
      const at = tok ? t0[ti]! : end;
      starts[c] = at; ends[c] = at;
    }
  }
  for (let c = 1; c < chars.length; c++) { if (starts[c]! < starts[c - 1]!) starts[c] = starts[c - 1]!; if (ends[c]! < starts[c]!) ends[c] = starts[c]!; }
  return { alignment: { chars, starts, ends }, matchedShare: matched / scorable };
}

/** Word timestamps for an audio clip from OpenAI's whisper-1 transcription. */
export async function transcribeWords(audio: Buffer, opts: { apiKey: string; prompt?: string; timeoutMs?: number }): Promise<TimedWord[]> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/mpeg' }), 'speech.mp3');
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  if (opts.prompt) form.append('prompt', opts.prompt.slice(0, 800));
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { authorization: `Bearer ${opts.apiKey}` }, body: form, signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  });
  if (!res.ok) throw new Error(`OpenAI transcription HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = (await res.json()) as { words?: TimedWord[] };
  return Array.isArray(j.words) ? j.words : [];
}
