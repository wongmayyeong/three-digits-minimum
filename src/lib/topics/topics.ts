/**
 * The single thesis. The debate engine keeps a topic abstraction so the arena can cite one
 * question, two hypotheses and a fixed evidence list; there is exactly one topic.
 */
import { THESIS_TITLE } from '@/lib/research/thesis';

export type TopicSlug = 'building-or-hype';

export interface TopicDef {
  slug: TopicSlug;
  order: number;
  shortLabel: string;
  title: string;
  question: string;
  framing: string;
  bullHypothesis: string;
  bearHypothesis: string;
  evidenceRequirements: { label: string; evidenceIds: string[] }[];
  evidenceIds: string[];
  usesModel: boolean;
}

const ERAS = ['SOCIAL', 'SIGNER', 'INTENTS'].flatMap((c) => [`ERA-${c}-PEAK`, `ERA-${c}-LATEST`, `ERA-${c}-RETENTION`]);
const EVENTS = ['BOS', 'CHAIN-SIGNATURES', 'INTENTS'].map((c) => `EVT-${c}-PRODUCT-2M`).concat(['BOS', 'CHAIN-SIGNATURES', 'USER-OWNED-AI', 'INTENTS'].flatMap((c) => [`EVT-${c}-DAA-90D`, `EVT-${c}-REL-90D`]));
const PAYS = ['COV-BUYBACK-REALIZED', 'COV-CAPTURE-MAX', 'SUP-NET-NEW-ANN-PCT', 'SUP-NET-NEW-ANN-USD', 'INT-TAKE-RATE', 'INT-TAKE-RATE-PRIOR', 'INT-REV-ANN', 'INT-BUYBACK-90D', 'INT-BUYBACK-SHARE', 'INT-FEE-RATE', 'INT-FEE-RATE-PRIOR', 'INT-CAPTURE', 'ONC-BUYBACK-WALLET', 'ONC-MAX-INFLATION', 'ONC-ISSUANCE-USD', 'VAL-NEAR-VALUE-CAPTURE-ANN', 'VAL-NEAR-MCAP-TO-CAPTURE'];
const MODEL = ['MODEL-BUYBACK-USD', 'MODEL-BUYBACK-TO-MCAP', 'MODEL-BREAKEVEN-VOL-2PCT', 'MODEL-VOL-MULTIPLE-2PCT', 'MODEL-REQ-TAKE-RATE-2PCT', 'MODEL-CURRENT-TAKE-RATE'];
const CONTEXT = ['MKT-NEAR-MCAP', 'MKT-NEAR-PRICE', 'MKT-NEAR-MCAP-1Y', 'INT-VOL-90D', 'INT-VOL-PRIOR-90D', 'INT-VOL-GROWTH', 'INT-VOL-ANN', 'ACT-DAA-30D', 'ACT-DAA-30D-1Y-AGO', 'ACT-DAA-YOY', 'ACT-TXN-30D', 'DEFI-TVL-NEAR', 'DEFI-TVL-NEAR-YOY', 'DEFI-STABLES-NEAR', 'INT-DEFINITIONS', 'INT-EXPLORER-TOP5-SHARE', 'ACT-RETENTION'];
const RUNG_IDS = [10, 25, 50, 100].flatMap((p) => [`LAD-${p}-MCAP`, `LAD-${p}-RANK`, ...['HYPERLIQUID', 'TRON', 'TODAY', 'SOLANA'].flatMap((m) => [`LAD-${p}-${m}-VOLUME`, `LAD-${p}-${m}-DEX-SHARE`, `LAD-${p}-${m}-CAGR`])]);
const LADDER = ['LAD-DEX-VOL-365D', 'LAD-INTENTS-DEX-SHARE', 'LAD-INTENTS-YOY', 'LAD-DEX-CAGR-2021-2025', 'LAD-SUPPLY-2036', 'LAD-SUPPLY-2036-HSP029', 'LAD-MULT-HYPERLIQUID', 'LAD-MULT-TRON', 'LAD-MULT-TODAY', 'LAD-MULT-SOLANA', ...RUNG_IDS,
  ...['LOW', 'BASE', 'HIGH'].flatMap((g) => ['HYPERLIQUID', 'TRON', 'TODAY', 'SOLANA'].map((m) => `LAD-IMPLIED-${g}-${m}`))];
const PEERS = ['NEAR', 'SOL', 'SUI', 'AVAX'].flatMap((c) => [`PEER-${c}-MCAP-TO-FEES`]).concat(['MKT-SOL-MCAP', 'MKT-SUI-MCAP', 'MKT-AVAX-MCAP', 'PEER-NEAR-FEES-30D', 'PEER-SOL-FEES-30D', 'PEER-SUI-FEES-30D', 'PEER-AVAX-FEES-30D']);

export const THESIS_TOPIC: TopicDef = {
  slug: 'building-or-hype',
  order: 1,
  shortLabel: 'Three Digits?',
  title: THESIS_TITLE,
  question: THESIS_TITLE,
  framing: `"Three digits, minimum": how far can NEAR really go in ten years? The price ladder prices out $10, $25, $50 and $100: the market cap, the revenue reaching holders and the NEAR Intents volume and DEX share each rung requires under valuation multiples seen in the market today. Argue which rungs the evidence can reach, not whether NEAR is good technology.`,
  bullHypothesis: 'Three digits is reachable: NEAR Intents is a fast-growing cross-chain settlement product already returning revenue to $NEAR, growing far faster than the DEX market, and the ladder shows the conditions for $100 are demanding but specific and checkable every year.',
  bearHypothesis: 'NEAR can succeed without reaching three digits: $100 makes NEAR the third most valuable crypto asset and needs years of compounding, a lasting valuation premium and no fee war. Argue the range the evidence actually supports, which may be well below $100 or include downside.',
  evidenceRequirements: [
    { label: 'The price ladder: market cap, required volume and DEX share for each rung', evidenceIds: ['LAD-100-MCAP', 'LAD-100-RANK', 'LAD-25-TODAY-DEX-SHARE', 'LAD-100-TODAY-DEX-SHARE', 'LAD-100-TRON-DEX-SHARE'] },
    { label: 'Valuation multiples seen in the market today', evidenceIds: ['LAD-MULT-HYPERLIQUID', 'LAD-MULT-TRON', 'LAD-MULT-TODAY', 'LAD-MULT-SOLANA'] },
    { label: 'NEAR Intents momentum and share of the DEX market', evidenceIds: ['LAD-INTENTS-YOY', 'LAD-INTENTS-DEX-SHARE', 'LAD-DEX-VOL-365D'] },
    { label: 'Monthly activity of each era\'s product (social.near and v1.signer transactions, Intents swap volume; exact data only)', evidenceIds: ['ERA-SOCIAL-LATEST', 'ERA-SIGNER-LATEST', 'ERA-INTENTS-LATEST'] },
    { label: 'Product adoption after each mainnet launch', evidenceIds: EVENTS.filter((e) => e.endsWith('PRODUCT-2M')) },
    { label: 'Buybacks versus realized net new supply', evidenceIds: ['COV-BUYBACK-REALIZED', 'SUP-NET-NEW-ANN-PCT'] },
    { label: 'Intents volume, fees and take rate', evidenceIds: ['INT-VOL-90D', 'INT-TAKE-RATE'] },
  ],
  evidenceIds: [...LADDER, ...ERAS, ...EVENTS, ...PAYS, ...MODEL, ...CONTEXT, ...PEERS],
  usesModel: true,
};

export const TOPICS: TopicDef[] = [THESIS_TOPIC];
export const TOPIC_SLUGS = ['building-or-hype'] as [TopicSlug, ...TopicSlug[]];

export function getTopic(slug: string): TopicDef | null {
  return slug === THESIS_TOPIC.slug ? THESIS_TOPIC : null;
}
