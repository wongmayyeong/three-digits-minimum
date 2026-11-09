/**
 * The single thesis. The debate engine keeps a topic abstraction so the arena can cite one
 * question, two hypotheses and a fixed evidence list; there is exactly one topic.
 */
import { THESIS_SUBTITLE, THESIS_TITLE } from '@/lib/research/thesis';

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
const PEERS = ['NEAR', 'SOL', 'SUI', 'AVAX'].flatMap((c) => [`PEER-${c}-MCAP-TO-FEES`]).concat(['MKT-SOL-MCAP', 'MKT-SUI-MCAP', 'MKT-AVAX-MCAP', 'PEER-NEAR-FEES-30D', 'PEER-SOL-FEES-30D', 'PEER-SUI-FEES-30D', 'PEER-AVAX-FEES-30D']);

export const THESIS_TOPIC: TopicDef = {
  slug: 'building-or-hype',
  order: 1,
  shortLabel: 'Building or Hype?',
  title: THESIS_TITLE,
  question: THESIS_TITLE,
  framing: `${THESIS_SUBTITLE} NEAR has moved from a scalable L1 to Social and BOS, Chain Abstraction, Intents and AI. The test: did each era's product keep real usage, did adoption follow each pivot, and does today's activity pay the token?`,
  bullHypothesis: 'NEAR is building: each era left products and capabilities that still carry real activity, adoption followed the pivots, and Intents revenue is now flowing back to the token at a rising rate.',
  bearHypothesis: 'NEAR is following the hype: era products fade once the narrative moves on, adoption did not follow the announcements, and value returned to the token is small next to new supply.',
  evidenceRequirements: [
    { label: 'Monthly activity of each era\'s product (social.near and v1.signer transactions, Intents swap volume; exact data only)', evidenceIds: ['ERA-SOCIAL-LATEST', 'ERA-SIGNER-LATEST', 'ERA-INTENTS-LATEST'] },
    { label: 'Product adoption after each mainnet launch', evidenceIds: EVENTS.filter((e) => e.endsWith('PRODUCT-2M')) },
    { label: 'Buybacks versus realized net new supply', evidenceIds: ['COV-BUYBACK-REALIZED', 'SUP-NET-NEW-ANN-PCT'] },
    { label: 'Intents volume, fees and take rate', evidenceIds: ['INT-VOL-90D', 'INT-TAKE-RATE'] },
  ],
  evidenceIds: [...ERAS, ...EVENTS, ...PAYS, ...MODEL, ...CONTEXT, ...PEERS],
  usesModel: true,
};

export const TOPICS: TopicDef[] = [THESIS_TOPIC];
export const TOPIC_SLUGS = ['building-or-hype'] as [TopicSlug, ...TopicSlug[]];

export function getTopic(slug: string): TopicDef | null {
  return slug === THESIS_TOPIC.slug ? THESIS_TOPIC : null;
}
