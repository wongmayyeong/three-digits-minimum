/**
 * The three curated debate topics. Server-defined: API input may only select one of these
 * slugs, and each topic selects evidence by ID from the shared research dataset.
 */

export type TopicSlug = 'intents-bet' | 'growth-or-hype' | 'long-game';

export interface TopicDef {
  slug: TopicSlug;
  order: number;
  shortLabel: string;
  title: string;
  question: string;
  framing: string;
  bullHypothesis: string;
  bearHypothesis: string;
  /** What evidence the topic needs, shown on the topic page with availability. */
  evidenceRequirements: { label: string; evidenceIds: string[] }[];
  /** Evidence IDs included in this topic's snapshot (model items are always included for topic 1 and 3). */
  evidenceIds: string[];
  /** Whether the break-even model is part of this topic. */
  usesModel: boolean;
}

const INTENTS_CORE = ['INT-VOL-90D', 'INT-VOL-PRIOR-90D', 'INT-VOL-GROWTH', 'INT-VOL-ANN', 'INT-FEES-90D', 'INT-FEES-PRIOR-90D', 'INT-FEE-RATE', 'INT-FEE-RATE-PRIOR', 'INT-REV-90D', 'INT-REV-PRIOR-90D', 'INT-REV-ANN', 'INT-CAPTURE', 'INT-CAPTURE-PRIOR', 'INT-TAKE-RATE', 'INT-TAKE-RATE-PRIOR', 'INT-BUYBACK-90D', 'INT-BUYBACK-SHARE', 'INT-DEFINITIONS'];
const MODEL = ['MODEL-BUYBACK-USD', 'MODEL-BUYBACK-TO-MCAP', 'MODEL-BREAKEVEN-VOL-2PCT', 'MODEL-VOL-MULTIPLE-2PCT', 'MODEL-REQ-TAKE-RATE-2PCT', 'MODEL-CURRENT-TAKE-RATE'];
const EXPLORER = ['INT-EXPLORER-TOP5-SHARE', 'INT-EXPLORER-MEDIAN-SWAP'];
const ACTIVITY = ['ACT-DAA-30D', 'ACT-DAA-30D-1Y-AGO', 'ACT-DAA-YOY', 'ACT-TXN-30D', 'ACT-NEW-30D', 'ACT-GAS-FEES-30D', 'ACT-RETENTION'];
const DEFI = ['DEFI-TVL-NEAR', 'DEFI-TVL-NEAR-1Y-AGO', 'DEFI-TVL-NEAR-YOY', 'DEFI-RHEA-LEND-TVL', 'DEFI-RHEA-DEX-TVL', 'DEFI-STABLES-NEAR'];
const PEERS = ['NEAR', 'SOL', 'SUI', 'AVAX'].flatMap((c) => [`PEER-${c}-FEES-30D`, `PEER-${c}-TVL`, `PEER-${c}-DEX-30D`, `PEER-${c}-MCAP-TO-FEES`, `PEER-${c}-MCAP-TO-TVL`]);

export const TOPICS: TopicDef[] = [
  {
    slug: 'intents-bet',
    order: 1,
    shortLabel: 'The Intents Bet',
    title: 'Can NEAR Intents generate economically meaningful value for NEAR?',
    question: 'Can NEAR Intents generate economically meaningful value for NEAR token holders, beyond headline swap volume?',
    framing: 'Intents volume is real and growing. The open question is how much of each swapped dollar reaches NEAR, and whether that amount matters next to a multi-billion-dollar market cap.',
    bullHypothesis: 'Intents is compounding volume at a fee rate that holds, NEAR captures a measurable share, and that share already funds open-market buybacks. Moderate growth makes buyback demand material.',
    bearHypothesis: 'Most fees go to solvers and distributors, buybacks are a small fraction of market cap and are held rather than burned, and fee competition will compress the take before volume can close the gap.',
    evidenceRequirements: [
      { label: 'Swap volume over matched windows', evidenceIds: ['INT-VOL-90D', 'INT-VOL-PRIOR-90D'] },
      { label: 'Gross fees and NEAR-captured revenue', evidenceIds: ['INT-FEES-90D', 'INT-REV-90D'] },
      { label: 'Revenue classified as buybacks', evidenceIds: ['INT-BUYBACK-90D'] },
      { label: 'Onchain buyback wallet balance', evidenceIds: ['ONC-BUYBACK-WALLET'] },
      { label: 'Circulating market cap', evidenceIds: ['MKT-NEAR-MCAP'] },
      { label: 'Integrator concentration (partner API)', evidenceIds: EXPLORER },
    ],
    evidenceIds: ['MKT-NEAR-MCAP', 'MKT-NEAR-PRICE', ...INTENTS_CORE, 'ONC-BUYBACK-WALLET', 'ONC-TOTAL-SUPPLY', 'ONC-BUYBACK-PCT-SUPPLY', 'ONC-MAX-INFLATION', 'ONC-ISSUANCE-USD', 'PEER-NEAR-DEX-30D', ...EXPLORER, ...MODEL],
    usesModel: true,
  },
  {
    slug: 'growth-or-hype',
    order: 2,
    shortLabel: 'Growth or Hype?',
    title: 'Is NEAR\'s real adoption strong enough to justify its valuation?',
    question: 'Is NEAR\'s ecosystem adoption and economic activity strong enough to justify its current valuation?',
    framing: 'Market cap, fees, accounts and DeFi deposits tell different stories. Transactions alone do not prove adoption, and accounts are not people.',
    bullHypothesis: 'Economic activity (Intents volume, stablecoins, DeFi deposits) is growing regardless of raw account counts, and token-level value capture is now measurable, so the valuation rests on real usage.',
    bearHypothesis: 'Account activity, base-layer fees and DeFi depth are too small relative to market cap, so the valuation is not explained by measurable usage.',
    evidenceRequirements: [
      { label: 'Market cap and price history', evidenceIds: ['MKT-NEAR-MCAP', 'MKT-NEAR-MCAP-1Y'] },
      { label: 'Active accounts, matched year-over-year', evidenceIds: ['ACT-DAA-30D', 'ACT-DAA-30D-1Y-AGO'] },
      { label: 'Base-layer fees and burns', evidenceIds: ['FEES-NEAR-CHAIN-90D', 'FEES-NEAR-BURN-90D'] },
      { label: 'DeFi TVL, RHEA and stablecoins', evidenceIds: ['DEFI-TVL-NEAR', 'DEFI-RHEA-LEND-TVL', 'DEFI-STABLES-NEAR'] },
      { label: 'Retained signer cohorts (BigQuery)', evidenceIds: ['ACT-RETENTION'] },
    ],
    evidenceIds: ['MKT-NEAR-MCAP', 'MKT-NEAR-PRICE', 'MKT-NEAR-MCAP-1Y', ...ACTIVITY, ...DEFI, 'FEES-NEAR-CHAIN-90D', 'FEES-NEAR-BURN-90D', 'INT-VOL-90D', 'INT-VOL-GROWTH', 'INT-REV-ANN', 'INT-BUYBACK-90D', 'VAL-NEAR-VALUE-CAPTURE-ANN', 'VAL-NEAR-MCAP-TO-CAPTURE', 'PEER-NEAR-MCAP-TO-FEES', 'PEER-NEAR-DEX-30D', 'ONC-MAX-INFLATION', 'ONC-ISSUANCE-USD'],
    usesModel: false,
  },
  {
    slug: 'long-game',
    order: 3,
    shortLabel: 'The Long Game',
    title: 'Can NEAR become a stronger long-term investment than competing L1s?',
    question: 'Over 3 to 5 years, can NEAR become a stronger long-term investment than Solana, Sui and Avalanche?',
    framing: 'Compared on one matched 30-day window and one fee definition. Chain abstraction and agent infrastructure are claims to test against measurable milestones, not facts.',
    bullHypothesis: 'NEAR\'s Intents layer earns revenue from activity on other chains, a source of value capture its peers lack, and its valuation multiples are not out of line once that revenue is counted.',
    bearHypothesis: 'On matched data NEAR trails peers on fees, DEX depth and TVL, its multiple on base-layer fees is high, and cross-chain revenue is small and contestable.',
    evidenceRequirements: [
      { label: 'Peer market caps (matched fetch)', evidenceIds: ['MKT-NEAR-MCAP', 'MKT-SOL-MCAP', 'MKT-SUI-MCAP', 'MKT-AVAX-MCAP'] },
      { label: 'Chain fees on one 30-day window', evidenceIds: ['PEER-NEAR-FEES-30D', 'PEER-SOL-FEES-30D', 'PEER-SUI-FEES-30D', 'PEER-AVAX-FEES-30D'] },
      { label: 'DeFi TVL and DEX volume', evidenceIds: ['PEER-NEAR-TVL', 'PEER-SOL-TVL', 'PEER-NEAR-DEX-30D', 'PEER-SOL-DEX-30D'] },
      { label: 'Cross-chain revenue (Intents)', evidenceIds: ['INT-REV-ANN'] },
      { label: 'Tokenomics: issuance and buybacks', evidenceIds: ['ONC-MAX-INFLATION', 'ONC-BUYBACK-WALLET'] },
    ],
    evidenceIds: ['MKT-NEAR-MCAP', 'MKT-SOL-MCAP', 'MKT-SUI-MCAP', 'MKT-AVAX-MCAP', ...PEERS, 'INT-VOL-ANN', 'INT-VOL-GROWTH', 'INT-REV-ANN', 'INT-CAPTURE', 'VAL-NEAR-VALUE-CAPTURE-ANN', 'VAL-NEAR-MCAP-TO-CAPTURE', 'ACT-DAA-30D', 'ACT-DAA-YOY', 'ONC-MAX-INFLATION', 'ONC-ISSUANCE-USD', 'ONC-BUYBACK-WALLET', 'MODEL-BUYBACK-TO-MCAP', 'MODEL-VOL-MULTIPLE-2PCT'],
    usesModel: true,
  },
];

export const TOPIC_SLUGS = TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]];

export function getTopic(slug: string): TopicDef | null {
  return TOPICS.find((t) => t.slug === slug) ?? null;
}
