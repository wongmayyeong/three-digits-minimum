const slugs = ['ethereum','solana','tron','bsc','hyperliquid','near','near-intents','avalanche','sui','aptos','ton','base'];
const types = ['dailyFees','dailyRevenue','dailyHoldersRevenue'];
const out = {};
const now = Date.now()/1000;
for (const s of slugs) {
  out[s] = {};
  for (const t of types) {
    try {
      const r = await fetch(`https://api.llama.fi/summary/fees/${s}?dataType=${t}`);
      if (!r.ok) { out[s][t] = null; continue; }
      const j = await r.json();
      const c = j.totalDataChart || [];
      const last365 = c.filter(([ts]) => ts > now - 365*86400 - 86400*2 && ts <= now - 86400*1);
      out[s][t] = last365.length > 300 ? last365.reduce((a,[,v]) => a+v, 0) : null;
      out[s].name = j.name;
    } catch { out[s][t] = null; }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(s, JSON.stringify(Object.fromEntries(Object.entries(out[s]).map(([k,v]) => [k, typeof v === 'number' ? (v/1e6).toFixed(1)+'M' : v]))));
}
(await import('node:fs')).writeFileSync('data/peers.json', JSON.stringify(out, null, 1));
