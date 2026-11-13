/**
 * Turns canonical speechText into stored audio. Synthesis happens once per unique
 * (text, voice, settings) combination; replays and duplicate requests reuse the asset.
 */
import { sha256, stableStringify } from '@/lib/data/sources';
import { db } from '@/lib/storage/db';
import { putObject } from '@/lib/storage/assets';
import { emit } from '@/lib/debate/events';
import { recordUsage } from '@/lib/debate/budget';
import { synthesizeElevenLabs, SpeechError } from './elevenlabs';
import { synthesizeOpenAI } from './openai-tts';
import { VOICES, voiceIdFor, voiceStatus, type Role } from './voices';

export async function processAudioJob(turnId: string): Promise<'ready' | 'unavailable' | 'skipped'> {
  const turn = await db().debateTurn.findUnique({ where: { id: turnId } });
  if (!turn) return 'skipped';
  if (turn.audioStatus === 'READY') return 'skipped';
  const status = voiceStatus();
  if (!status.configured) {
    await db().debateTurn.update({ where: { id: turnId }, data: { audioStatus: 'UNAVAILABLE', audioError: status.reason } });
    await emit(turn.sessionId, 'audio', { turnId, status: 'UNAVAILABLE' });
    return 'unavailable';
  }
  // Voice never generates content: it reads exactly the stored, hashed speechText.
  if (sha256(turn.speechText) !== turn.textHash) throw new SpeechError('Transcript hash mismatch; refusing to synthesize altered text.', false);
  const role = turn.actor as Role;
  const voice = VOICES[role];
  const provider = status.provider as 'elevenlabs' | 'openai';
  const voiceId = provider === 'openai' ? voice.openai.voice : voiceIdFor(role)!;
  const model = status.model!;
  const settings = provider === 'openai' ? voice.openai : voice.settings;
  const cacheKey = sha256(stableStringify({ provider, model, voiceId, settings, textHash: turn.textHash }));
  const usageProvider = { id: provider, pricing: { inputPerM: 0, outputPerM: 0 } };
  // gpt-4o-mini-tts is billed per audio minute (about $0.015); per 1k characters that is roughly $0.012.
  const perK = Number(process.env.TTS_PRICE_PER_1K_CHARS ?? (provider === 'openai' ? 0.012 : 0.1));

  let asset = await db().audioAsset.findUnique({ where: { cacheKey } });
  if (!asset) {
    let result;
    try {
      result = provider === 'openai'
        ? await synthesizeOpenAI(turn.speechText, voice, { apiKey: process.env.OPENAI_API_KEY!, model })
        : await synthesizeElevenLabs(turn.speechText, voice, voiceId, { apiKey: process.env.ELEVENLABS_API_KEY!, model });
    } catch (e) {
      await recordUsage({ sessionId: turn.sessionId, provider: usageProvider, kind: 'tts', model, inputTokens: 0, outputTokens: 0, characters: 0, usdOverride: 0, success: false });
      throw e;
    }
    await recordUsage({ sessionId: turn.sessionId, provider: usageProvider, kind: 'tts', model, inputTokens: 0, outputTokens: 0, characters: turn.speechText.length, usdOverride: (turn.speechText.length / 1000) * perK, success: true });
    const stored = await putObject(`audio/${cacheKey}.mp3`, result.audio, result.mimeType);
    asset = await db().audioAsset.upsert({
      where: { cacheKey },
      update: {},
      create: {
        cacheKey, provider, model, voiceId, role, mimeType: result.mimeType, durationSec: result.durationSec,
        alignment: (result.alignment ?? {}) as object, alignmentKind: result.alignmentKind, transcriptHash: turn.textHash,
        storageDriver: stored.driver, storageKey: stored.key, data: stored.inline ? new Uint8Array(stored.inline) : null, sizeBytes: result.audio.length,
      },
    });
  }
  await db().debateTurn.update({ where: { id: turnId }, data: { audioStatus: 'READY', audioError: null, audioAssetId: asset.id } });
  await emit(turn.sessionId, 'audio', { turnId, status: 'READY', durationSec: asset.durationSec });
  return 'ready';
}

export async function markAudioFailed(turnId: string, error: string) {
  const turn = await db().debateTurn.update({ where: { id: turnId }, data: { audioStatus: 'FAILED', audioError: error.slice(0, 300) } });
  await emit(turn.sessionId, 'audio', { turnId, status: 'FAILED' });
}
