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
  { phase: 'BULL_OPEN', actor: 'bull', code: 'BO', title: 'Bull opening', round: 'Opening', minWords: 100, maxWords: 180, maxClaims: 4, requiresRebuttal: false,
    instruction: 'Give your opening case. Lead with the strongest measured evidence for the Bull hypothesis, state what it implies, and acknowledge one weakness up front.' },
  { phase: 'BEAR_OPEN', actor: 'bear', code: 'XO', title: 'Bear opening', round: 'Opening', minWords: 100, maxWords: 180, maxClaims: 4, requiresRebuttal: false,
    instruction: 'Give your opening case for the Bear hypothesis. Lead with the evidence that most undermines the Bull case. You may answer one Bull claim directly.' },
  { phase: 'BULL_REBUTTAL', actor: 'bull', code: 'BR', title: 'Bull rebuttal', round: 'Rebuttal', minWords: 100, maxWords: 180, maxClaims: 3, requiresRebuttal: true,
    instruction: 'Rebut Bear\'s strongest claims with counterevidence from the snapshot. Name the claim you answer. Concede anything the data clearly supports.' },
  { phase: 'BEAR_REBUTTAL', actor: 'bear', code: 'XR', title: 'Bear rebuttal', round: 'Rebuttal', minWords: 100, maxWords: 180, maxClaims: 3, requiresRebuttal: true,
    instruction: 'Rebut Bull\'s rebuttal. Stress-test the model inputs Bull relies on (fee rate, capture, buyback share, growth). Name the claim you answer.' },
  { phase: 'BULL_CLOSE', actor: 'bull', code: 'BC', title: 'Bull closing', round: 'Closing', minWords: 100, maxWords: 170, maxClaims: 3, requiresRebuttal: false,
    instruction: 'Close. State your thesis in one sentence, the two strongest pieces of evidence, the biggest unknown, and the measurable milestone that would confirm it.' },
  { phase: 'BEAR_CLOSE', actor: 'bear', code: 'XC', title: 'Bear closing', round: 'Closing', minWords: 100, maxWords: 170, maxClaims: 3, requiresRebuttal: false,
    instruction: 'Close. State your thesis in one sentence, the two strongest pieces of evidence, and the measurable result that would prove you wrong.' },
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
