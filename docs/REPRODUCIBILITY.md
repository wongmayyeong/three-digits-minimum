# Reproducibility

A step-by-step guide to rebuilding and verifying the research in this repository. Everything marked **verified** below was run on 14 November 2026 and produced the output shown. For what the numbers mean, see [THESIS.md](../THESIS.md); for how they are computed, [METHODOLOGY.md](METHODOLOGY.md); for where they come from, [DATA_AND_QUERIES.md](DATA_AND_QUERIES.md).

Two different guarantees are offered, and they should not be confused:

| | A. Offline reproduction | B. Fresh data collection |
|---|---|---|
| Command | `npm run research:rebuild` | `npm run research:refresh` |
| Input | Committed raw responses in `artifacts/research/raw/` | Live public APIs |
| Network | Only for `npm ci` | Required |
| Credentials | None | None required; optional keys raise rate limits |
| Output | Byte-identical to the committed `canonical.json`, or exit 1 | A new snapshot that will differ |
| Guarantees | The published numbers follow deterministically from the stored inputs | Freshness, not reproducibility |

Response hashes show that a rebuild used the files that were fetched. They do not show that the source data, or its interpretation, is correct.

---

## Environment

| Requirement | Value |
|---|---|
| Runtime | Node.js 22 or newer (`"engines": {"node": ">=22"}`); verified on Node 24.11.0 |
| Package manager | npm (lockfile `package-lock.json`); verified with npm 9.9.4 |
| OS | Any OS Node supports; verified on Windows 11 with Git Bash. Commands are POSIX shell |
| Disk | About 1 GB for `node_modules` |
| Database | Not needed for the research rebuild. PostgreSQL is needed only for the web app and the integration test |

Environment variables are documented in [`.env.example`](../.env.example). The research rebuild needs none. Optional ones for fresh data: `COINGECKO_DEMO_API_KEY` or `COINGECKO_PRO_API_KEY`, `NEARBLOCKS_API_KEY`, `INTENTS_EXPLORER_JWT`, `GOOGLE_CLOUD_PROJECT` with Google credentials. Never commit a `.env` file; it is gitignored.

## Setup

```bash
git clone https://github.com/wongmayyeong/three-digits-minimum.git
cd three-digits-minimum
npm ci
```

`npm ci` installs the exact dependency versions in the lockfile (654 packages, about a minute).

## Research rebuild (offline)

```bash
npm run research:rebuild
```

What it does (`prisma generate && tsx research/refresh.ts --offline`, see [`research/refresh.ts`](../research/refresh.ts)):

1. Generates the Prisma client (the research code shares types with the web app; no database connection is made).
2. Reads every request in the catalog from `artifacts/research/raw/` instead of the network. Requests with no stored copy are reported as `SKIPPED` (in this snapshot only `intents-explorer.recent`, which needs a partner JWT).
3. Reads the 97 stored monthly era counts and the stored FastNEAR revenue-wallet record (5,336 flows).
4. Builds the evidence dataset and all models, and evaluates the falsification triggers.
5. Serializes `canonical.json` and compares its SHA-256 with the committed file. If they differ, it prints `Offline rebuild differs from committed output. Investigate before publishing.` and exits 1 without writing.
6. Writes `canonical.json`, `evidence-manifest.json`, `charts/`, `dashboard.html` and regenerates `THESIS.md` from `research/THESIS.template.md`.

**Expected output (verified, fresh clone at commit `fb1396b`):**

```
Offline rebuild from artifacts/research/raw
  era history: 97/97 months available (0 fetched now)
  revenue-wallet flows: 5336
  SKIPPED      intents-explorer.recent  (offline mode and no stored copy)

Reproducibility check: rebuild is byte-identical to the committed canonical.json (sha256 3f16cb62c559b7be).

Wrote canonical.json (539 evidence items, 522 available), 20 chart datasets, dashboard.html and THESIS.md.
Window: 90 days ending 2026-11-10; peer window ends 2026-11-10.
THESIS.md marks these as unavailable: INT-EXPLORER-TOP5-SHARE
Verdict: MIXED (low confidence). S1 MIXED, S2 BUILDING, S3 HYPE
  F1 NOT TRIGGERED  volume 84.1%; take rate 0.027% -> 0.042%
  F2 NOT TRIGGERED  0.135% -> 0.155%
  F3 NOT TRIGGERED  4.47x today's run rate
  F4 TRIGGERED      -76.3% vs a year earlier
  F5 NOT TRIGGERED  41.4% vs a year earlier
  F6 TRIGGERED      0.471% of market cap
```

The "Verdict" line is the supporting evidence-rules reading ([METHODOLOGY.md §13](METHODOLOGY.md#13-verdict-methodology)), not the investment verdict. The run takes about 40 seconds.

Then confirm nothing changed:

```bash
git status --short artifacts THESIS.md
```

**Expected (verified):** no output.

## Verification

### Verify source hashes

Every stored response's SHA-256 should equal its manifest entry:

```bash
node -e "const fs=require('fs'),c=require('crypto');const m=JSON.parse(fs.readFileSync('artifacts/research/raw/manifest.json','utf8'));let ok=0,bad=[];for(const e of Object.values(m)){const t=fs.readFileSync('artifacts/research/raw/'+e.file,'utf8');c.createHash('sha256').update(t).digest('hex')===e.sha256?ok++:bad.push(e.file)}console.log(ok+' of '+Object.keys(m).length+' raw files match their manifest SHA-256'+(bad.length?'; mismatched: '+bad.join(', '):''))"
```

**Expected (verified):** `262 of 262 raw files match their manifest SHA-256`

Committed file hashes for reference:

```bash
sha256sum artifacts/research/canonical.json artifacts/research/raw/manifest.json
```

```
3f16cb62c559b7be478b5fe862c30cd6593b6dde73f5ade16b00757cea579cc7  artifacts/research/canonical.json
03383741f299892d58aa39591915d7dbc4458a92c9bad5d4f284952036750983  artifacts/research/raw/manifest.json
```

### Spot-check calculated findings

```bash
node -e "const c=require('./artifacts/research/canonical.json');const v=(id)=>c.evidence.find((e)=>e.evidenceId===id).value;console.log({windowEnd:c.windowEnd,price:v('MKT-NEAR-PRICE'),multipleToday:v('LAD-MULT-TODAY'),growthFor100:v('LAD-100-TODAY-CAGR'),implied2036At20pct:v('LAD-IMPLIED-BASE-TODAY'),deliveredShare:v('TOK-DELIVERED-ALL-VS-DESIGNATED')})"
```

**Expected (verified):**

```
{
  windowEnd: '2026-11-10',
  price: 3.51,
  multipleToday: 212.40302690140334,
  growthFor100: 0.4399729899531626,
  implied2036At20pct: 16.26632157585381,
  deliveredShare: 0.6704891468490377
}
```

These match THESIS.md: 212x, 44.0% a year, $16 and 67.0%.

### Recompute one figure by hand

The $100 growth requirement at NEAR's own multiple, from values in `canonical.json` (`ladder.inputs` and `ladder.rungs`):

```
supply_2036     = 1,678,796,612 NEAR       (1,311,473,230 circulating, 2.5% a year, monthly, 10 years)
market_cap_2036 = $100 × supply_2036 = $167.88B
value_needed    = $167.88B / 212.40 = $790.38M a year
intents_needed  = $790.38M − $1.06M burns = $789.32M
volume_needed   = $789.32M / 0.00041960 = $1.881T a year
growth_needed   = ($1.881T / $49.077B)^(1/10) − 1 = 44.0% a year
```

### Inspect output files

- `artifacts/research/canonical.json`: every evidence item and model output.
- `artifacts/research/evidence-manifest.json`: for any evidence ID, the request URL, retrieval time and response hash it came from.
- `artifacts/research/dashboard.html`: open in a browser; every chart with its query.
- `THESIS.md`: every figure is filled from `canonical.json`; the template is `research/THESIS.template.md`.

### Automated tests

| Check | Command | Result (verified 14 Nov 2026) |
|---|---|---|
| Unit and integration tests | `npm test` | 14 files, 102 tests passed |
| Types | `npm run typecheck` | Passes, no errors |
| Lint | `npm run lint` | Passes on the tracked code (see note) |
| End-to-end, desktop and mobile | `npm run test:e2e` | Not re-run for this documentation pass |

The unit tests cover the ladder, tokenomics, valuation, cross-chain, economy, market, the buyback model, series and evidence helpers, the thesis rules, the citation and number audit, speech and playback. The integration test (`tests/integration/debate.test.ts`) runs the debate engine against a real PostgreSQL database at `TEST_DATABASE_URL`, default `postgresql://thesis:thesis-local@localhost:54339/thesis_test`. Start it first in a separate terminal:

```bash
npm run db:local
```

Lint note: `eslint .` also scans untracked local folders if they exist (for example build output or a local `video/` workspace); the tracked code lints clean with `npx eslint . --ignore-pattern "video/**" --ignore-pattern ".next-*/**"`.

The end-to-end suite (`tests/e2e/arena.spec.ts`) starts a dev server on port 3100 and a worker against the test database, uses the synthetic LLM fixture (no credentials), and needs network access for live public data.

### Deterministic calculations

Determinism comes from four rules in the code: every number is computed from stored responses only; JSON is serialized with sorted keys before hashing; windows are fixed by the common end date in the data, not the clock; and nothing is estimated to fill gaps. The rebuild's byte-identity check enforces it on every run.

## Fresh data

```bash
npm run research:refresh
```

This fetches every request in the catalog from the live APIs (CoinGecko, DefiLlama, NearBlocks, NEAR RPC, FastNEAR), stores the new responses with their hashes, rebuilds every artifact and regenerates THESIS.md. It takes about a minute, or about 15 minutes on the first run while monthly era history is collected at NearBlocks free-tier pacing. A necessary source with neither a fresh nor a stored response makes it exit 1 and write nothing.

Expect the outputs to differ from the committed snapshot: prices move, aggregators revise history, and the window end advances. `npm run research:refresh -- --verify` additionally checks that an offline rebuild of the new responses is byte-identical. After an intentional methodology change, `npm run research:accept` rewrites the committed outputs without the identity check.

Optional analyses not in the snapshot:

```bash
npm run research:bigquery -- --dry-run   # needs GOOGLE_CLOUD_PROJECT; cost estimate only
```

The BigQuery queries have never been executed for this research ([DATA_AND_QUERIES.md §9](DATA_AND_QUERIES.md#9-queries-that-are-written-but-not-executed)).

## Running the web app locally

```bash
npm ci
npm run db:local                      # embedded PostgreSQL on port 54339; keep it running
cp .env.example .env                  # set DATABASE_URL (printed by db:local) and CLIENT_HASH_SALT
npx prisma migrate deploy
npx tsx scripts/sync-raw-to-db.ts     # load the committed raw responses into the database
npm run dev                           # http://localhost:3000
```

Pages: `/` (verdict, ladder, findings, hypotheses), `/research` (charts with queries and hashes), `/methodology` (formulas, calculator, reproduce section), `/debates/[id]` (debate episodes). With the committed responses loaded, the site shows the same numbers as THESIS.md.

New debates additionally need an LLM key (`OPENAI_API_KEY`, or `LLM_API_KEY` with `LLM_BASE_URL` and `LLM_MODEL`) and the background worker (`npm run worker`). Without a key, browsing and replays work and starting a debate is disabled. For pipeline testing only, `THESIS_FIXTURE_LLM=1` enables a synthetic template LLM; it refuses to run in production and labels its debates SYNTHETIC. Debates are not needed to reproduce any research number.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `npm ci` fails with an engine error, or syntax errors on start | Node older than 22 | Install Node 22 or newer |
| `Offline rebuild differs from committed output` | A raw file, the code or a dependency changed | `git status` and `git diff artifacts src research`; run the hash check above; reinstall with `npm ci` |
| Hash check reports mismatched files | A raw file was edited or re-saved (for example line-ending conversion) | `git checkout -- artifacts/research/raw`; `.gitattributes` keeps them byte-exact |
| `Necessary sources unavailable with no stored copy` | Missing raw files (offline) or failed fetches (online) | Restore `artifacts/research/raw`; for a refresh, retry later |
| `FAILED` or HTTP 429 during refresh | Provider rate limit | Wait and retry; set `COINGECKO_DEMO_API_KEY` or `NEARBLOCKS_API_KEY` |
| `UNCONFIGURED` / `SKIPPED intents-explorer.recent` | No `INTENTS_EXPLORER_JWT` | Expected; integrator concentration stays unavailable |
| Refresh finishes but numbers changed | Live data moved or a provider revised history | Expected for fresh data; compare with the committed snapshot instead of overwriting it |
| `Cannot find module '@/generated/prisma'` | Prisma client not generated | Use the npm scripts (they run `prisma generate`) or run `npx prisma generate` |
| Integration test fails to connect | No PostgreSQL on port 54339 | Run `npm run db:local` in another terminal, or set `TEST_DATABASE_URL` |
| Site shows "unavailable" everywhere | Empty database | Run `npx tsx scripts/sync-raw-to-db.ts` |
| `/api/health` returns 503 `degraded` | No worker has checked in | Start `npm run worker`; the research pages work without it |
