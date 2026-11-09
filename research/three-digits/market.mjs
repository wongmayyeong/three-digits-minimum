const fs = await import('node:fs');
const yearly = (chart) => { const by = {}; for (const [ts, v] of chart) { const y = new Date(ts * 1000).getUTCFullYear(); by[y] = (by[y] || 0) + v; } return by; };
const last365 = (chart) => { const now = Date.now() / 1000; return chart.filter(([t]) => t > now - 366 * 86400 && t <= now - 86400).reduce((a, [, v]) => a + v, 0); };
const out = {};
for (const [k, url] of [['dex', 'https://api.llama.fi/overview/dexs?excludeTotalDataChartBreakdown=true'], ['aggregators', 'https://api.llama.fi/overview/aggregators?excludeTotalDataChartBreakdown=true'], ['bridgeAgg', 'https://api.llama.fi/overview/bridge-aggregators?excludeTotalDataChartBreakdown=true']]) {
  try {
    const j = await (await fetch(url)).json();
    const c = j.totalDataChart || [];
    out[k] = { last365: last365(c), yearly: yearly(c), first: c[0] ? new Date(c[0][0] * 1000).toISOString().slice(0, 10) : null, top: (j.protocols || []).sort((a, b) => (b.total30d || 0) - (a.total30d || 0)).slice(0, 8).map((p) => [p.name, Math.round((p.total30d || 0) / 1e6)]) };
    console.log(k, 'last365 $' + (out[k].last365 / 1e12).toFixed(2) + 'T', 'from', out[k].first);
    console.log('  yearly', Object.entries(out[k].yearly).map(([y, v]) => y + ':' + (v / 1e12).toFixed(2) + 'T').join(' '));
    console.log('  top30d $M', JSON.stringify(out[k].top));
  } catch (e) { console.log(k, 'error', e.message); }
}
const chains = await (await fetch('https://api.llama.fi/v2/chains')).json();
out.tvl = Object.fromEntries(chains.filter((c) => ['Ethereum', 'Solana', 'BSC', 'Tron', 'Near', 'Hyperliquid L1', 'Base', 'Sui', 'Avalanche'].includes(c.name)).map((c) => [c.name, c.tvl]));
console.log('tvl $B', JSON.stringify(Object.fromEntries(Object.entries(out.tvl).map(([k, v]) => [k, (v / 1e9).toFixed(2)]))));
const st = await (await fetch('https://stablecoins.llama.fi/stablecoinchains')).json();
out.stables = Object.fromEntries(st.filter((c) => ['Ethereum', 'Solana', 'BSC', 'Tron', 'Near', 'Base', 'Sui', 'Avalanche', 'Hyperliquid L1'].includes(c.name)).map((c) => [c.name, c.totalCirculatingUSD?.peggedUSD ?? null]));
console.log('stables $B', JSON.stringify(Object.fromEntries(Object.entries(out.stables).map(([k, v]) => [k, v === null ? null : (v / 1e9).toFixed(2)]))));
fs.writeFileSync('data/market.json', JSON.stringify(out, null, 1));
