/** Lists ElevenLabs premade voices so you can choose ELEVENLABS_VOICE_BULL / BEAR / JUDGE. */
import 'dotenv/config';
import { listElevenLabsVoices } from '@/lib/audio/elevenlabs';

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('Set ELEVENLABS_API_KEY in .env first.');
  process.exit(2);
}
const voices = await listElevenLabsVoices(key);
for (const v of voices) {
  const labels = Object.entries(v.labels ?? {}).map(([k, x]) => `${k}=${x}`).join(', ');
  console.log(`${v.voice_id}  ${v.name.padEnd(18)} ${labels}`);
}
console.log('\nSuggested direction: Bull energetic and bright; Bear restrained and precise; Judge calm and low-tempo.');
