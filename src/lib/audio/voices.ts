/**
 * Per-role voice direction. Provider voice IDs come from configuration (use
 * `npm run voices:list` to pick licensed premade voices). No voice cloning of real people.
 */

export type Role = 'bull' | 'bear' | 'judge';

export interface VoiceDirection {
  role: Role;
  envVoiceId: string;
  description: string;
  /** ElevenLabs voice_settings. */
  settings: { stability: number; similarity_boost: number; style: number; speed: number; use_speaker_boost: boolean };
  /** Browser speechSynthesis fallback prosody. */
  browser: { rate: number; pitch: number };
}

export const VOICES: Record<Role, VoiceDirection> = {
  bull: {
    role: 'bull', envVoiceId: 'ELEVENLABS_VOICE_BULL',
    description: 'Energetic, confident, bright; quick but clear.',
    settings: { stability: 0.38, similarity_boost: 0.75, style: 0.35, speed: 1.06, use_speaker_boost: true },
    browser: { rate: 1.08, pitch: 1.08 },
  },
  bear: {
    role: 'bear', envVoiceId: 'ELEVENLABS_VOICE_BEAR',
    description: 'Skeptical, restrained, precise; slightly sharper tempo, less theatrical.',
    settings: { stability: 0.62, similarity_boost: 0.75, style: 0.12, speed: 1.02, use_speaker_boost: true },
    browser: { rate: 1.02, pitch: 0.9 },
  },
  judge: {
    role: 'judge', envVoiceId: 'ELEVENLABS_VOICE_JUDGE',
    description: 'Calm, lower tempo, neutral and authoritative.',
    settings: { stability: 0.78, similarity_boost: 0.7, style: 0.05, speed: 0.94, use_speaker_boost: true },
    browser: { rate: 0.92, pitch: 0.96 },
  },
};

export function voiceIdFor(role: Role): string | null {
  return process.env[VOICES[role].envVoiceId] || null;
}

export interface VoiceStatus {
  configured: boolean;
  provider: 'elevenlabs' | 'none';
  model: string | null;
  reason: string | null;
}

export function voiceStatus(): VoiceStatus {
  if (!process.env.ELEVENLABS_API_KEY) return { configured: false, provider: 'none', model: null, reason: 'ELEVENLABS_API_KEY is not set. Debates play with captions or your device\'s browser voice.' };
  const missing = (['bull', 'bear', 'judge'] as Role[]).filter((r) => !voiceIdFor(r)).map((r) => VOICES[r].envVoiceId);
  if (missing.length) return { configured: false, provider: 'none', model: null, reason: `Voice IDs not configured: ${missing.join(', ')}. Run npm run voices:list.` };
  return { configured: true, provider: 'elevenlabs', model: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2', reason: null };
}
