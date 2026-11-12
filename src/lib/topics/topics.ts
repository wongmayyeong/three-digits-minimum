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
const MULTS = ['HYPERLIQUID', 'TRON', 'TODAY'];
const RUNG_IDS = [10, 25, 50, 100].flatMap((p) => [`LAD-${p}-MCAP`, `LAD-${p}-RANK`, `LAD-${p}-PLAT-SOLANA-STABLES`, `LAD-${p}-PLAT-SOLANA-STABLES-MULT`, ...MULTS.flatMap((m) => [`LAD-${p}-${m}-VOLUME`, `LAD-${p}-${m}-DEX-SHARE`, `LAD-${p}-${m}-CAGR`])]);
const LADDER = ['LAD-SPOT-DEX-RUNRATE', 'LAD-INTENTS-DEX-SHARE', 'LAD-INTENTS-DEX-SHARE-365D', 'LAD-INTENTS-YOY', 'LAD-DEX-CAGR-2021-2025', 'LAD-SUPPLY-2036', 'LAD-SUPPLY-2036-HSP029', 'LAD-NEAR-CAPTURE-RUNRATE', 'LAD-HOLDER-TAKE-RATE',
  ...MULTS.flatMap((m) => [`LAD-MULT-${m}`, `LAD-MULT-${m}-365D`]), ...RUNG_IDS, ...['LOW', 'BASE', 'HIGH'].flatMap((g) => MULTS.map((m) => `LAD-IMPLIED-${g}-${m}`)),
  ...['DESIGNATED', 'DELIVERED'].flatMap((b) => [`LAD-BASIS-${b}-MULT`, `LAD-BASIS-${b}-TAKE`, `LAD-BASIS-${b}-100-TODAY-SHARE`, `LAD-BASIS-${b}-100-TRON-SHARE`, `LAD-BASIS-${b}-IMPLIED-TRON`])];
/** The audited research: token economics, economy map, competition, valuation, alternatives, hypotheses. */
const RESEARCH = ['TOK-CAPTURED-REPRODUCED', 'TOK-REPRODUCTION-RATIO', 'TOK-DESIGNATED-SINCE', 'TOK-DELIVERED-USD', 'TOK-DELIVERED-VS-DESIGNATED', 'TOK-DELIVERED-ALL-VS-DESIGNATED', 'TOK-FRONTEND-RETAINED', 'TOK-NON-INTENTS-INFLOWS',
  'TOK-DELIVERED-RUNRATE', 'TOK-DESIGNATED-RUNRATE', 'TOK-BUYBACK-ABSORPTION', 'TOK-VERIFIED-CAPTURE', 'TOK-STAKING-RATIO', 'TOK-STAKING-NOMINAL', 'TOK-STAKING-REAL', 'TOK-NONSTAKER-REAL', 'TOK-GROSS-ISSUANCE',
  ...['NEAR', 'BTC', 'ETH', 'SOL', 'HYPE'].flatMap((a) => [`TOK-${a}-OWNERSHIP-DILUTION`, `TOK-${a}-FDV-MCAP`]), 'TOK-NEAR-TREASURY-ABSORPTION',
  'ECO-INTENTS-FEE-SHARE', 'ECO-CAPTURE-FROM-INTENTS', 'ECO-L1-TXNS-YOY', 'ECO-L1-ACTIVE-YOY', 'ECO-L1-GAS-YOY', 'ECO-INTENTS-VOL-YOY', 'ECO-SIGNER-PARTICIPANTS', 'RISK-VALIDATOR-NAKAMOTO',
  'CC-INTENTS-VENUE-SHARE', 'CC-PEER-MEDIAN-CAP-REV', 'CC-PEER-MEDIAN-CAP-REV-LIQUID', 'CC-PEER-MEDIAN-CAP-HOLDERS', 'CC-NEAR-CAP-INTENTS-REV', 'CC-NEAR-IMPLIED-CAP', 'CC-NEAR-INTENTS-REVENUE', 'CC-RELAY-REVENUE', 'CC-THORCHAIN-REVENUE', 'CC-NEAR-INTENTS-TAKE-RATE', 'CC-THORCHAIN-TAKE-RATE', 'CC-CHAINFLIP-TAKE-RATE',
  'VAL-MULT-HIST-NEAR', 'VAL-MULT-HIST-NEAR-DELIVERED', 'VAL-SENS-BASE', ...[100, 25].flatMap((p) => ['LOW', 'BASE', 'HIGH'].map((g) => `VAL-MULT-NEEDED-${p}-${g}`)),
  ...['NEAR', 'ETH', 'SOL', 'HYPE', 'BTC'].flatMap((a) => [`OPP-${a}-7X-CAGR`, `OPP-${a}-OBSERVED`, `OPP-${a}-VOL-1Y`, `OPP-${a}-MAXDD-3Y`, `OPP-${a}-CORR-BTC`]),
  'MKT-SPOT-TRAILING', 'MKT-SPOT-CAGR', 'MKT-CROSSCHAIN-TRAILING', 'MKT-STABLECOINS-TRAILING', 'MKT-X402-TRAILING', 'MKT-SPOT-TOP5',
  ...['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10'].map((h) => `HYP-${h}`)];
const PEERS = ['NEAR', 'SOL', 'SUI', 'AVAX'].flatMap((c) => [`PEER-${c}-MCAP-TO-FEES`]).concat(['MKT-SOL-MCAP', 'MKT-SUI-MCAP', 'MKT-AVAX-MCAP', 'PEER-NEAR-FEES-30D', 'PEER-SOL-FEES-30D', 'PEER-SUI-FEES-30D', 'PEER-AVAX-FEES-30D']);

export const THESIS_TOPIC: TopicDef = {
  slug: 'building-or-hype',
  order: 1,
  shortLabel: 'Three Digits?',
  title: THESIS_TITLE,
  question: THESIS_TITLE,
  framing: `"Three digits, minimum": how far can NEAR really go in ten years, and why would an investor choose it over the alternatives, or not? The research prices out $10, $25, $50 and $100 under cash-flow multiples on two revenue bases (DefiLlama's designated buybacks and NEAR delivered to the buyback wallet), maps NEAR's economy product by product, compares NEAR Intents with its cross-chain rivals and NEAR with BTC, ETH, SOL, HYPE and others, and tests ten hypotheses. Argue which rungs the evidence can reach and why an investor would or would not prefer NEAR, not whether NEAR is good technology.`,
  bullHypothesis: 'Three digits is reachable: NEAR Intents leads the cross-chain venues with public data and earns the most revenue among its rivals, it is growing far faster than the DEX market, NEAR reports all of its supply as circulating, and the ladder shows the conditions for $100 are demanding but specific and checkable every year.',
  bearHypothesis: 'NEAR is a concentrated, high-volatility bet on one product: its market cap is many times both its on-chain economy and the revenue cross-chain peers are valued on, only part of the revenue labelled as buybacks has reached the buyback wallet, issuance outpaces what buybacks absorb, and $100 needs a platform-level multiple or decade-long hypergrowth. Argue the range the evidence actually supports, which may be well below $100 or include downside.',
  evidenceRequirements: [
    { label: 'The price ladder: market cap, required volume and DEX share for each rung', evidenceIds: ['LAD-100-MCAP', 'LAD-100-RANK', 'LAD-25-TODAY-DEX-SHARE', 'LAD-100-TODAY-DEX-SHARE', 'LAD-100-TRON-DEX-SHARE'] },
    { label: 'Cash-flow multiples on one basis, and NEAR on the designated and delivered bases', evidenceIds: ['LAD-MULT-HYPERLIQUID', 'LAD-MULT-TRON', 'LAD-MULT-TODAY', 'LAD-BASIS-DELIVERED-MULT'] },
    { label: 'NEAR Intents momentum and size relative to spot DEX volume', evidenceIds: ['LAD-INTENTS-YOY', 'LAD-INTENTS-DEX-SHARE', 'LAD-SPOT-DEX-RUNRATE'] },
    { label: 'Where the designated buybacks went (onchain reconciliation)', evidenceIds: ['TOK-DESIGNATED-SINCE', 'TOK-DELIVERED-ALL-VS-DESIGNATED', 'TOK-FRONTEND-RETAINED', 'TOK-REPRODUCTION-RATIO'] },
    { label: 'NEAR\'s economy and its cross-chain competition', evidenceIds: ['ECO-INTENTS-FEE-SHARE', 'ECO-L1-TXNS-YOY', 'CC-NEAR-CAP-INTENTS-REV', 'CC-PEER-MEDIAN-CAP-REV'] },
    { label: 'Hypotheses tested by published rules', evidenceIds: ['HYP-H1', 'HYP-H2', 'HYP-H4', 'HYP-H5', 'HYP-H6'] },
    { label: 'Monthly activity of each era\'s product (social.near and v1.signer transactions, Intents swap volume; exact data only)', evidenceIds: ['ERA-SOCIAL-LATEST', 'ERA-SIGNER-LATEST', 'ERA-INTENTS-LATEST'] },
    { label: 'Product adoption after each mainnet launch', evidenceIds: EVENTS.filter((e) => e.endsWith('PRODUCT-2M')) },
    { label: 'Supply: net issuance, buyback absorption and ownership dilution', evidenceIds: ['SUP-NET-NEW-ANN-PCT', 'TOK-BUYBACK-ABSORPTION', 'TOK-NEAR-OWNERSHIP-DILUTION'] },
    { label: 'Intents volume, fees and take rate', evidenceIds: ['INT-VOL-90D', 'INT-TAKE-RATE'] },
  ],
  evidenceIds: [...LADDER, ...RESEARCH, ...ERAS, ...EVENTS, ...PAYS, ...MODEL, ...CONTEXT, ...PEERS],
  usesModel: true,
};

export const TOPICS: TopicDef[] = [THESIS_TOPIC];
export const TOPIC_SLUGS = ['building-or-hype'] as [TopicSlug, ...TopicSlug[]];

export function getTopic(slug: string): TopicDef | null {
  return slug === THESIS_TOPIC.slug ? THESIS_TOPIC : null;
}
