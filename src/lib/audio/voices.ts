/**
 * Per-role voice direction. Two providers:
 * - ElevenLabs, when ELEVENLABS_API_KEY and the three voice IDs are set (`npm run voices:list` lists premade voices);
 * - otherwise OpenAI text-to-speech, when OPENAI_API_KEY is set: built-in voices directed by a per-role delivery
 *   instruction (gpt-4o-mini-tts reads the text exactly; the instruction only shapes tone and pace).
 * Set TTS_PROVIDER=none to turn synthesized voices off. No voice cloning of real people.
 */

export type Role = 'bull' | 'bear' | 'judge';
export type VoiceProvider = 'elevenlabs' | 'openai' | 'none';

export interface VoiceDirection {
  role: Role;
  envVoiceId: string;
  description: string;
  /** ElevenLabs voice_settings. */
  settings: { stability: number; similarity_boost: number; style: number; speed: number; use_speaker_boost: boolean };
  /** OpenAI built-in voice, delivery instruction and speed. */
  openai: { voice: string; instructions: string; speed: number };
  /** Browser speechSynthesis fallback prosody. */
  browser: { rate: number; pitch: number };
}

const LIVE = 'You are on a live televised debate stage, speaking to a packed room. Sound like a real person thinking on their feet, not a narrator reading a script. Read the text exactly as written.';

export const VOICES: Record<Role, VoiceDirection> = {
  bull: {
    role: 'bull', envVoiceId: 'ELEVENLABS_VOICE_BULL',
    description: 'Energetic, confident, bright; quick but clear.',
    settings: { stability: 0.3, similarity_boost: 0.75, style: 0.55, speed: 1.08, use_speaker_boost: true },
    openai: {
      voice: 'ash', speed: 1.08,
      instructions: `${LIVE} Character: the Bull, a fired-up optimist who believes in what they are saying. Delivery: fast, punchy and passionate, with real conviction and momentum. Lean hard into key numbers, rise in energy toward the end of each point, sound almost indignant when dismissing the other side, and land the final line like a mic drop. Short natural pauses before big claims.`,
    },
    browser: { rate: 1.1, pitch: 1.08 },
  },
  bear: {
    role: 'bear', envVoiceId: 'ELEVENLABS_VOICE_BEAR',
    description: 'Skeptical, cutting, precise; intense without shouting.',
    settings: { stability: 0.45, similarity_boost: 0.75, style: 0.45, speed: 1.05, use_speaker_boost: true },
    openai: {
      voice: 'onyx', speed: 1.05,
      instructions: `${LIVE} Character: the Bear, a sharp, unimpressed skeptic who has heard every sales pitch before. Delivery: intense, controlled and cutting. A low, firm voice with an edge of disbelief at the opponent's claims; press hard on numbers as if laying down evidence in court; brief, pointed pauses after rhetorical questions; sarcasm where the text invites it, never cartoonish.`,
    },
    browser: { rate: 1.04, pitch: 0.9 },
  },
  judge: {
    role: 'judge', envVoiceId: 'ELEVENLABS_VOICE_JUDGE',
    description: 'Calm, authoritative, deliberate.',
    settings: { stability: 0.7, similarity_boost: 0.7, style: 0.2, speed: 0.98, use_speaker_boost: true },
    openai: {
      voice: 'marin', speed: 1.0,
      instructions: `${LIVE} Character: the Judge, delivering a verdict that settles a heated debate. Delivery: commanding, measured and serious, with gravitas. Even pace, crisp diction, a slight build of tension before the final verdict, and a decisive, unhurried last sentence.`,
    },
    browser: { rate: 0.95, pitch: 0.96 },
  },
};

export function voiceIdFor(role: Role): string | null {
  return process.env[VOICES[role].envVoiceId] || null;
}

export interface VoiceStatus {
  configured: boolean;
  provider: VoiceProvider;
  model: string | null;
  reason: string | null;
}

export function voiceStatus(): VoiceStatus {
  const choice = (process.env.TTS_PROVIDER ?? '').toLowerCase();
  if (choice === 'none') return { configured: false, provider: 'none', model: null, reason: 'Synthesized voices are turned off (TTS_PROVIDER=none). Debates play with captions or your device\'s browser voice.' };
  const eleven = !!process.env.ELEVENLABS_API_KEY && (['bull', 'bear', 'judge'] as Role[]).every((r) => voiceIdFor(r));
  if (choice !== 'openai' && eleven) return { configured: true, provider: 'elevenlabs', model: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2', reason: null };
  if (choice !== 'elevenlabs' && process.env.OPENAI_API_KEY) return { configured: true, provider: 'openai', model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts', reason: null };
  if (process.env.ELEVENLABS_API_KEY) {
    const missing = (['bull', 'bear', 'judge'] as Role[]).filter((r) => !voiceIdFor(r)).map((r) => VOICES[r].envVoiceId);
    return { configured: false, provider: 'none', model: null, reason: `Voice IDs not configured: ${missing.join(', ')}. Run npm run voices:list.` };
  }
  return { configured: false, provider: 'none', model: null, reason: 'No voice provider is configured (set OPENAI_API_KEY or ELEVENLABS_API_KEY). Debates play with captions or your device\'s browser voice.' };
}
