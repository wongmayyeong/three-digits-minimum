# Three Digits, Minimum? todo

## Keys and configuration
- [ ] Add `OPENAI_API_KEY` to `.env` (optionally set `OPENAI_MODEL`), then restart the worker and web server
- [ ] Get an ElevenLabs key, run `npm run voices:list`, and set `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_BULL`, `ELEVENLABS_VOICE_BEAR`, `ELEVENLABS_VOICE_JUDGE`
- [ ] Optional: request an Intents Explorer partner JWT at https://partners.near-intents.org and set `INTENTS_EXPLORER_JWT`
- [ ] Optional: set `COINGECKO_DEMO_API_KEY` and `NEARBLOCKS_API_KEY` for higher rate limits
- [ ] Optional: set `GOOGLE_CLOUD_PROJECT` plus credentials, then run `npm run research:bigquery`
- [ ] Set a long random `CLIENT_HASH_SALT`

## Verify with real AI
- [ ] Run a real debate on The Intents Bet, from Start debate through the verdict
- [ ] Check the transcript, citations, audit flags, scorecard and report make sense
- [ ] Test Replay and Rematch with new data
- [ ] With voices configured, check the audio, captions and mouth animation stay in sync
- [ ] Run one debate each for Growth or Hype? and The Long Game

## Finish the product
- [ ] Fix the 5px horizontal scroll on the home page at phone width
- [ ] Review the screenshots at desktop and mobile sizes and polish the design
- [ ] Write BRANDING.md (design tokens, typography, characters, motion rules)
- [ ] Write DEPLOY.md (hosting, managed Postgres, worker process, backups, monitoring `/api/health`)
- [ ] Write the 90-second demo script
- [ ] Run `npm run research:refresh` close to submission so THESIS.md has fresh numbers

## Hackathon submission (deadline 2026-11-14 23:59 UTC)
- [x] Decide which project to submit: Three Digits, Minimum? (one submission per repository)
- [ ] Re-read https://nearhackathon.com/HACKATHON.md for rule changes
- [ ] Deploy a hosted demo (recommended; keep it up until at least 2026-11-18)
- [ ] Make the repository public on GitHub
- [ ] Record the demo video
- [ ] Post on X: say it was built at NEAR HACKATHON, tag @NEARProtocol and #NEARHackathon, attach the video
- [ ] Submit at https://nearhackathon.com (project name, team size, email, NEAR payout account, repo URL, X post URL, description, track `thesis`)

## My todo
- [ ] 
