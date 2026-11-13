/**
 * OpenAI text-to-speech: POST /v1/audio/speech with a built-in voice and a delivery instruction.
 * The request text is the canonical, already-validated speechText; the instruction shapes only tone and pace.
 * OpenAI returns no timestamps, so the clip is transcribed once with word timestamps and aligned to the script
 * (word-timing.ts); captions and mouths then follow the real speech. If that fails, captions fall back to
 * proportional timing. The duration is measured from the MP3 frames, so playback advances when the speech ends.
 */
import { SpeechError, type SpeechResult } from './elevenlabs';
import type { VoiceDirection } from './voices';
import { alignWords, transcribeWords } from './word-timing';

export async function synthesizeOpenAI(text: string, voice: VoiceDirection, opts: { apiKey: string; model: string; timeoutMs?: number }): Promise<SpeechResult> {
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { authorization: `Bearer ${opts.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: opts.model, voice: voice.openai.voice, input: text, instructions: voice.openai.instructions, speed: voice.openai.speed, response_format: 'mp3' }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
    });
  } catch (e) {
    throw new SpeechError(`OpenAI speech request failed: ${(e as Error).message}`, true);
  }
  if (!res.ok) {
    const body = await res.text();
    let msg = body.slice(0, 160);
    try { msg = String((JSON.parse(body) as { error?: { message?: string } }).error?.message ?? msg).slice(0, 200); } catch { /* keep raw */ }
    throw new SpeechError(`OpenAI speech HTTP ${res.status}: ${msg}`, res.status === 429 || res.status >= 500);
  }
  const audio = Buffer.from(await res.arrayBuffer());
  if (!audio.length) throw new SpeechError('OpenAI returned no audio', true);
  const durationSec = mp3Duration(audio);
  if (!durationSec) throw new SpeechError('OpenAI returned audio whose length could not be measured', true);
  const timing = await timeSpeech(text, audio, durationSec, opts.apiKey);
  return { audio, mimeType: 'audio/mpeg', durationSec, alignment: timing?.alignment ?? null, alignmentKind: timing ? 'character' : 'none', model: opts.model, voiceId: voice.openai.voice };
}

/** Word-timed caption alignment for a clip, or null if transcription fails or matches too little of the script. */
export async function timeSpeech(text: string, audio: Buffer, durationSec: number, apiKey: string) {
  try {
    const words = await transcribeWords(audio, { apiKey, prompt: text });
    return alignWords(text, words, durationSec);
  } catch {
    return null;
  }
}

const BITRATES: Record<string, number[]> = {
  // [version][layer 3] kbps by index; MPEG-1 and MPEG-2/2.5 Layer III.
  v1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  v2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/** Sums MPEG Layer III frame durations (skipping any ID3 tag). Returns seconds, or 0 if no frames are found. */
export function mp3Duration(buf: Buffer): number {
  let i = 0;
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    i = 10 + ((buf[6]! & 0x7f) << 21 | (buf[7]! & 0x7f) << 14 | (buf[8]! & 0x7f) << 7 | (buf[9]! & 0x7f));
  }
  let seconds = 0;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1]! & 0xe0) !== 0xe0) { i++; continue; }
    const version = (buf[i + 1]! >> 3) & 0x03; // 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
    const layer = (buf[i + 1]! >> 1) & 0x03; // 1 = Layer III
    const brIdx = (buf[i + 2]! >> 4) & 0x0f;
    const srIdx = (buf[i + 2]! >> 2) & 0x03;
    const pad = (buf[i + 2]! >> 1) & 0x01;
    if (version === 1 || layer !== 1 || brIdx === 0 || brIdx === 15 || srIdx === 3) { i++; continue; }
    const kbps = (version === 3 ? BITRATES.v1 : BITRATES.v2)![brIdx]!;
    const rate = RATES[version]![srIdx]!;
    const samples = version === 3 ? 1152 : 576;
    const len = Math.floor(((samples / 8) * kbps * 1000) / rate) + pad;
    if (len < 4) { i++; continue; }
    seconds += samples / rate;
    i += len;
  }
  return seconds;
}
