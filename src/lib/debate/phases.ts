/** The debate state machine and per-phase instructions. Shared by server and client. */

export type DebatePhase = 'BULL_OPEN' | 'BEAR_OPEN' | 'BULL_REBUTTAL' | 'BEAR_REBUTTAL' | 'BULL_CLOSE' | 'BEAR_CLOSE';
export type DebateStatus = 'PENDING' | 'FETCHING' | 'VALIDATING' | 'MODELING' | DebatePhase | 'JUDGING' | 'COMPLETE' | 'PARTIAL' | 'FAILED';

export interface PhaseDef {
  phase: DebatePhase;
  actor: 'bull' | 'bear';
  code: string;
  title: string;
  round: string;
  instruction: string;
  minWords: number;
  maxWords: number;
  maxClaims: number;
  requiresRebuttal: boolean;
}

export const PHASES: PhaseDef[] = [
  { phase: 'BULL_OPEN', actor: 'bull', code: 'BO', title: 'Bull opening', round: 'Opening', minWords: 90, maxWords: 160, maxClaims: 4, requiresRebuttal: false,
    instruction: 'Open the show. Grab the room in your first sentence, hit them with the strongest measured evidence for the Bull hypothesis, say what it means, and get ahead of one weakness before Bear can use it.' },
  { phase: 'BEAR_OPEN', actor: 'bear', code: 'XO', title: 'Bear opening', round: 'Opening', minWords: 90, maxWords: 160, maxClaims: 4, requiresRebuttal: false,
    instruction: 'Make your opening case for the Bear hypothesis. Go straight at what Bull just said, then lay down the evidence that most undermines the Bull case.' },
  { phase: 'BULL_REBUTTAL', actor: 'bull', code: 'BR', title: 'Bull rebuttal', round: 'Rebuttal', minWords: 80, maxWords: 150, maxClaims: 3, requiresRebuttal: true,
    instruction: 'Fire back at Bear\'s strongest claims with counterevidence from the snapshot. Say in plain words which of Bear\'s points you are answering. Concede what the data clearly supports, quickly, then turn it around.' },
  { phase: 'BEAR_REBUTTAL', actor: 'bear', code: 'XR', title: 'Bear rebuttal', round: 'Rebuttal', minWords: 80, maxWords: 150, maxClaims: 3, requiresRebuttal: true,
    instruction: 'Tear into Bull\'s rebuttal. Stress-test the assumptions Bull leans on (fee rate, capture, buyback share, growth). Say in plain words which of Bull\'s points you are answering.' },
  { phase: 'BULL_CLOSE', actor: 'bull', code: 'BC', title: 'Bull closing', round: 'Closing', minWords: 80, maxWords: 140, maxClaims: 3, requiresRebuttal: false,
    instruction: 'Close it out. Your thesis in one sentence, your two strongest pieces of evidence, the biggest unknown, and the measurable milestone that would prove you right. Finish strong.' },
  { phase: 'BEAR_CLOSE', actor: 'bear', code: 'XC', title: 'Bear closing', round: 'Closing', minWords: 80, maxWords: 140, maxClaims: 3, requiresRebuttal: false,
    instruction: 'Close it out and take the last word. Your thesis in one sentence, your two strongest pieces of evidence, and the measurable result that would prove you wrong. Finish strong.' },
];

export const STATUS_ORDER: DebateStatus[] = ['PENDING', 'FETCHING', 'VALIDATING', 'MODELING', ...PHASES.map((p) => p.phase), 'JUDGING', 'COMPLETE'];

export function nextStatus(s: DebateStatus): DebateStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i >= 0 && i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1]! : null;
}

export function phaseDef(p: string): PhaseDef | undefined {
  return PHASES.find((x) => x.phase === p);
}

export const STATUS_LABEL: Record<DebateStatus, string> = {
  PENDING: 'Queued',
  FETCHING: 'Fetching sources',
  VALIDATING: 'Validating evidence',
  MODELING: 'Running the model',
  BULL_OPEN: 'Bull opening',
  BEAR_OPEN: 'Bear opening',
  BULL_REBUTTAL: 'Bull rebuttal',
  BEAR_REBUTTAL: 'Bear rebuttal',
  BULL_CLOSE: 'Bull closing',
  BEAR_CLOSE: 'Bear closing',
  JUDGING: 'Judge reviewing',
  COMPLETE: 'Complete',
  PARTIAL: 'Stopped partway',
  FAILED: 'Failed',
};
