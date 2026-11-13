/**
 * Adds word-timed caption alignment to stored OpenAI voice clips that were generated without it.
 * Each clip is transcribed once (whisper-1, word timestamps) and aligned to its turn's exact speechText.
 * Usage: npx tsx --env-file=.env scripts/align-audio.ts
 */
import { db } from '../src/lib/storage/db';
import { getAudioBytes } from '../src/lib/storage/assets';
import { timeSpeech } from '../src/lib/audio/openai-tts';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) { console.error('OPENAI_API_KEY is not set.'); process.exit(1); }

const assets = await db().audioAsset.findMany({ where: { provider: 'openai', alignmentKind: 'none' }, select: { id: true, transcriptHash: true, durationSec: true, role: true } });
console.log(`${assets.length} clip(s) without caption timing`);
let done = 0;
for (const a of assets) {
  const turn = await db().debateTurn.findFirst({ where: { textHash: a.transcriptHash }, select: { speechText: true } });
  const audio = await getAudioBytes(a.id);
  if (!turn || !audio) { console.log(`  skip ${a.id}: ${!turn ? 'no turn text' : 'no audio bytes'}`); continue; }
  const timing = await timeSpeech(turn.speechText, audio.bytes, a.durationSec, apiKey);
  if (!timing) { console.log(`  skip ${a.id}: transcription did not match the script`); continue; }
  await db().audioAsset.update({ where: { id: a.id }, data: { alignment: timing.alignment as object, alignmentKind: 'character' } });
  done++;
  console.log(`  ${a.role.padEnd(5)} ${a.id}: ${(timing.matchedShare * 100).toFixed(0)}% of words matched`);
}
console.log(`aligned ${done} of ${assets.length}`);
process.exit(0);
