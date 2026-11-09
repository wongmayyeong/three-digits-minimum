// Exploratory $100 NEAR feasibility model. Inputs come from the JSON pulled in this folder and
// from the committed research register (Intents take rate, value capture).
import { readFileSync } from 'node:fs';
const top = JSON.parse(readFileSync('data/top.json', 'utf8'));
const peers = JSON.parse(readFileSync('data/peers.json', 'utf8'));
const market = JSON.parse(readFileSync('data/market.json', 'utf8'));
const coin = (s) => top.find((c) => c.symbol === s);
const near = coin('near');
const price = near.current_price, mcap = near.market_cap, circ = mcap / price;
const TARGET = 100, YEARS = 10;

// ---- supply paths to 2036
const supplyAt = (path) => {
  let s = circ;
  for (let m = 1; m <= YEARS * 12; m++) {
    const t = m / 12;
    let r = 0.025;
    if (path === 'hsp029') r = t <= 0.25 ? 0.025 : t >= 2.25 ? 0.016 : 0.025 - (0.009 * (t - 0.25)) / 2;
    s *= Math.pow(1 + r, 1 / 12);
  }
  return s;
};
const paths = { today: circ, cap25: supplyAt('cap25'), hsp029: supplyAt('hsp029') };
console.log(`NEAR price $${price} mcap $${(mcap / 1e9).toFixed(2)}B circ ${(circ / 1e9).toFixed(3)}B`);
console.log(`price multiple to $100: ${(TARGET / price).toFixed(1)}x; 10y price CAGR ${((Math.pow(TARGET / price, 1 / YEARS) - 1) * 100).toFixed(1)}%`);
for (const [k, s] of Object.entries(paths)) console.log(`supply ${k}: ${(s / 1e9).toFixed(3)}B -> mcap at $100 $${(s * TARGET / 1e9).toFixed(0)}B`);

// ---- ranking today
const nonStable = top.filter((c) => !['usdt', 'usdc', 'usds', 'usde', 'dai', 'usd1', 'figr_heloc', 'xaut', 'wbt', 'leo'].includes(c.symbol));
const mcap100 = circ * TARGET;
const rankAll = top.filter((c) => c.market_cap > mcap100).length + 1;
const rankNon = nonStable.filter((c) => c.market_cap > mcap100).length + 1;
const total = JSON.parse(readFileSync('data/global.json', 'utf8')).data.total_market_cap.usd;
console.log(`$100 today: rank #${rankAll} overall, #${rankNon} excluding stablecoins and wrapped/RWA; ${(mcap100 / total * 100).toFixed(1)}% of total crypto ($${(total / 1e12).toFixed(2)}T), now ${(mcap / total * 100).toFixed(2)}%`);
console.log(`vs SOL ${(mcap100 / coin('sol').market_cap).toFixed(2)}x, vs ETH ${(mcap100 / coin('eth').market_cap).toFixed(2)}x, vs BNB ${(mcap100 / coin('bnb').market_cap).toFixed(2)}x`);

// ---- valuation regimes: mcap / holders revenue (365d)
const reg = [['ETH', 'eth', 'ethereum'], ['BNB', 'bnb', 'bsc'], ['SOL', 'sol', 'solana'], ['TRX', 'trx', 'tron'], ['HYPE', 'hype', 'hyperliquid'], ['AVAX', 'avax', 'avalanche'], ['SUI', 'sui', 'sui']];
console.log('\nmcap / holders revenue (last 365d):');
const mult = {};
for (const [n, sym, slug] of reg) { const c = coin(sym); const r = peers[slug]?.dailyHoldersRevenue; mult[n] = c && r ? c.market_cap / r : null; console.log(`  ${n}: mcap $${(c.market_cap / 1e9).toFixed(1)}B rev $${(r / 1e6).toFixed(1)}M -> ${mult[n]?.toFixed(0)}x`); }
const nearCapture365 = (peers.near.dailyHoldersRevenue || 0) + (peers['near-intents'].dailyHoldersRevenue || 0);
const nearRunRate = 21.12e6; // VAL-NEAR-VALUE-CAPTURE-ANN (burn + Intents buybacks, 90-day run rate)
console.log(`  NEAR: 365d capture $${(nearCapture365 / 1e6).toFixed(1)}M -> ${(mcap / nearCapture365).toFixed(0)}x; run-rate $${(nearRunRate / 1e6).toFixed(1)}M -> ${(mcap / nearRunRate).toFixed(0)}x`);

// ---- Path A: cash flow
const take = { current: 0.00042, prior: 0.00026, halved: 0.00021 };
const intents365 = 32.9e9; // sum of DefiLlama monthly volume Nov 2025 - Oct 2026
const intentsRun = 48.05e9; // INT-VOL-ANN
const dex365 = market.dex.last365;
const dexGrowth = { low: 0.10, base: 0.20, high: 0.275 };
console.log(`\nIntents last 365d $${(intents365 / 1e9).toFixed(1)}B = ${(intents365 / dex365 * 100).toFixed(2)}% of DEX volume ($${(dex365 / 1e12).toFixed(2)}T); bridge aggregators $${(market.bridgeAgg.last365 / 1e9).toFixed(1)}B`);
console.log('\nPATH A: cash-flow valuation in 2036 (supply HSP-029 / 2.5% cap)');
for (const [label, m] of [['Hyperliquid multiple', mult.HYPE], ['Tron multiple', mult.TRX], ['NEAR today (run-rate)', mcap / nearRunRate]]) {
  for (const sp of ['hsp029', 'cap25']) {
    const mc = paths[sp] * TARGET;
    const R = mc / m;
    const V = R / take.current;
    const shares = Object.fromEntries(Object.entries(dexGrowth).map(([k, g]) => [k, V / (dex365 * Math.pow(1 + g, YEARS))]));
    const cagr = Math.pow(V / intentsRun, 1 / YEARS) - 1;
    console.log(`  ${label} ${m.toFixed(0)}x, ${sp}: holder revenue $${(R / 1e9).toFixed(2)}B/yr (${(R / nearRunRate).toFixed(0)}x today); Intents volume $${(V / 1e12).toFixed(2)}T/yr (${(V / intentsRun).toFixed(0)}x run-rate, CAGR ${(cagr * 100).toFixed(0)}%); share of 2036 DEX market low/base/high ${Object.values(shares).map((x) => (x * 100).toFixed(0) + '%').join('/')}`);
  }
}
console.log(`  (fee compression to ${take.halved * 100}% doubles the volume needed)`);

// ---- Path B: platform premium
console.log('\nPATH B: platform premium (mcap relative to the economy on the chain)');
const eco = [['ETH', 'eth', 'Ethereum'], ['BNB', 'bnb', 'BSC'], ['SOL', 'sol', 'Solana'], ['TRX', 'trx', 'Tron'], ['NEAR', 'near', 'Near']];
for (const [n, sym, ch] of eco) { const c = coin(sym); const st = market.stables[ch], tv = market.tvl[ch]; console.log(`  ${n}: mcap/stablecoins ${(c.market_cap / st).toFixed(1)}x, mcap/TVL ${(c.market_cap / tv).toFixed(1)}x (stables $${(st / 1e9).toFixed(2)}B, TVL $${(tv / 1e9).toFixed(2)}B)`); }
const mc36 = paths.hsp029 * TARGET;
for (const [n, sym, ch] of eco.slice(0, 4)) { const c = coin(sym); const st = mc36 / (c.market_cap / market.stables[ch]); const tv = mc36 / (c.market_cap / market.tvl[ch]); console.log(`  at ${n}'s ratios, NEAR in 2036 needs stablecoins $${(st / 1e9).toFixed(1)}B (${(st / market.stables.Near).toFixed(0)}x today) and TVL $${(tv / 1e9).toFixed(1)}B (${(tv / market.tvl.Near).toFixed(0)}x today)`); }
