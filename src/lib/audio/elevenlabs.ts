/**
 * ElevenLabs text-to-speech with character timestamps:
 * POST /v1/text-to-speech/{voice_id}/with-timestamps -> { audio_base64, alignment, normalized_alignment }.
 * The request text is the canonical, already-validated speechText. Nothing else is sent.
 */
import type { VoiceDirection } from './voices';

export interface SpeechResult {
  audio: Buffer;
  mimeType: string;
  durationSec: number;
  alignment: { chars: string[]; starts: number[]; ends: number[] } | null;
  alignmentKind: 'character' | 'none' | 'degraded';
  model: string;
  voiceId: string;
}

export class SpeechError extends Error {
  constructor(message: string, public retryable: boolean) { super(message); }
}

export async function synthesizeElevenLabs(text: string, voice: VoiceDirection, voiceId: string, opts: { apiKey: string; model: string; timeoutMs?: number }): Promise<SpeechResult> {
  let res: Response;
  try {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': opts.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ text, model_id: opts.model, voice_settings: voice.settings, apply_text_normalization: 'auto' }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
    });
  } catch (e) {
    throw new SpeechError(`ElevenLabs request failed: ${(e as Error).message}`, true);
  }
  const body = await res.text();
  if (!res.ok) {
    let msg = body.slice(0, 160);
    try { msg = JSON.stringify((JSON.parse(body) as { detail?: unknown }).detail ?? msg).slice(0, 200); } catch { /* keep raw */ }
    throw new SpeechError(`ElevenLabs HTTP ${res.status}: ${msg}`, res.status === 429 || res.status >= 500);
  }
  const j = JSON.parse(body) as { audio_base64?: string; alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } | null };
  if (!j.audio_base64) throw new SpeechError('ElevenLabs returned no audio', true);
  const audio = Buffer.from(j.audio_base64, 'base64');
  const a = j.alignment;
  const alignment = a && a.characters?.length ? { chars: a.characters, starts: a.character_start_times_seconds, ends: a.character_end_times_seconds } : null;
  // The alignment must spell the exact text we sent; otherwise captions could drift from speech.
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
  const kind = !alignment ? 'none' : normalize(alignment.chars.join('')) === normalize(text) ? 'character' : 'degraded';
  const durationSec = alignment?.ends.length ? alignment.ends[alignment.ends.length - 1]! : estimateMp3Duration(audio.length, 64_000);
  return { audio, mimeType: 'audio/mpeg', durationSec, alignment, alignmentKind: kind, model: opts.model, voiceId };
}

function estimateMp3Duration(bytes: number, bitrate: number): number {
  return (bytes * 8) / bitrate;
}

export async function listElevenLabsVoices(apiKey: string) {
  const res = await fetch('https://api.elevenlabs.io/v2/voices?category=premade&page_size=100', { headers: { 'xi-api-key': apiKey }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}`);
  const j = (await res.json()) as { voices: { voice_id: string; name: string; category: string; labels?: Record<string, string>; description?: string }[] };
  return j.voices;
}
