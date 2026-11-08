/**
 * Derives the stage state (who speaks, poses, gestures, verdict reactions) from the playback
 * clock. Pure: shared by the inline theatre and the fullscreen show so both behave identically.
 */
import type { Role, VisualState } from '@/components/characters/rigs';
import type { ClaimView, DebateView, TurnView } from '@/lib/debate/view';
import { gestureFor } from '@/lib/playback/timeline';
import type { StageCast } from './stage';

export const ROUND: Record<string, string> = {
  BULL_OPEN: 'Round 1 · Opening', BEAR_OPEN: 'Round 1 · Opening', BULL_REBUTTAL: 'Round 2 · Rebuttal', BEAR_REBUTTAL: 'Round 2 · Rebuttal',
  BULL_CLOSE: 'Round 3 · Closing', BEAR_CLOSE: 'Round 3 · Closing', JUDGING: 'Verdict',
};
export const NAME: Record<Role, string> = { bull: 'Bull', bear: 'Bear', judge: 'Judge' };

export interface PlaybackLike {
  turn: TurnView | null;
  claimId: string | null;
  beatIdx: number;
  secondsIntoBeat: number;
  speaking: boolean;
  playing: boolean;
  mouth: StageCast['mouths']['bull'];
  time: number;
  duration: number;
  ended: boolean;
}

export function claimIndex(view: DebateView) {
  const m = new Map<string, ClaimView & { actor: string }>();
  for (const t of view.turns) for (const c of t.claims) m.set(c.id, { ...c, actor: t.actor });
  return m;
}

export function computeCast(view: DebateView, pb: PlaybackLike, generating: boolean, allClaims: Map<string, ClaimView & { actor: string }>) {
  const turn = pb.turn;
  const judgeScene = turn?.actor === 'judge';
  const progress = pb.duration ? pb.time / pb.duration : 0;
  const afterVerdict = !!view.verdict && judgeScene && (progress > 0.9 || pb.ended);
  const activeClaim = turn?.claims.find((c) => c.id === pb.claimId) ?? null;

  const states: Record<Role, VisualState> = { bull: 'idle', bear: 'idle', judge: 'idle' };
  const mouths = { bull: 'closed', bear: 'closed', judge: 'closed' } as StageCast['mouths'];
  const look: Record<Role, number> = { bull: 0.8, bear: -0.8, judge: 0 };
  const gestures: StageCast['gestures'] = {};
  if (!turn) {
    if (generating) { states.bull = 'thinking'; states.bear = 'thinking'; states.judge = 'listening'; }
    return { cast: { active: null, states, mouths, look, gestures } as StageCast, judgeScene, afterVerdict, activeClaim };
  }
  const a = turn.actor;
  const rebutting = !!activeClaim?.rebuttedClaimId;
  const speakingState: VisualState = a === 'judge' ? 'judging' : rebutting ? 'rebutting' : 'speaking';
  states[a] = pb.speaking ? speakingState : pb.playing ? 'idle' : 'listening';
  mouths[a] = pb.mouth;
  if (pb.speaking) gestures[a] = gestureFor(pb.beatIdx, pb.secondsIntoBeat, rebutting);
  for (const r of ['bull', 'bear', 'judge'] as Role[]) {
    if (r === a) continue;
    states[r] = rebutting && allClaims.get(activeClaim!.rebuttedClaimId!)?.actor === r ? 'reacting' : 'listening';
    look[r] = a === 'bull' ? -0.9 : a === 'bear' ? 0.9 : r === 'bull' ? 0.9 : -0.9;
  }
  look.judge = a === 'judge' ? 0 : a === 'bull' ? -0.7 : 0.7;
  if (afterVerdict && view.verdict) {
    const w = view.verdict.winner;
    states.bull = w === 'bull' ? 'verdict-winning' : w === 'bear' ? 'verdict-losing' : 'thinking';
    states.bear = w === 'bear' ? 'verdict-winning' : w === 'bull' ? 'verdict-losing' : 'thinking';
    if (w !== 'inconclusive') { mouths.bull = w === 'bull' ? 'smile' : 'frown'; mouths.bear = w === 'bear' ? 'smile' : 'frown'; }
  }
  return { cast: { active: a, states, mouths, look, gestures } as StageCast, judgeScene, afterVerdict, activeClaim };
}
