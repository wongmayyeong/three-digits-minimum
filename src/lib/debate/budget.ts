/**
 * API cost controls. Every provider call is recorded with token counts and an estimated cost,
 * and new calls are refused once the daily budget is spent.
 */
import type { LlmProvider } from '@/lib/ai/provider';
import { db } from '@/lib/storage/db';
import { DebateStepError } from './errors';

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function dailyBudgetUsd(): number {
  const v = Number(process.env.DAILY_AI_BUDGET_USD ?? 15);
  return Number.isFinite(v) && v >= 0 ? v : 15;
}

export async function spentTodayUsd(): Promise<number> {
  const r = await db().usageRecord.aggregate({ _sum: { estimatedUsd: true }, where: { createdAt: { gte: startOfUtcDay() } } });
  return r._sum.estimatedUsd ?? 0;
}

export async function budgetCheck() {
  const spent = await spentTodayUsd();
  if (spent >= dailyBudgetUsd()) {
    throw new DebateStepError(`The daily AI budget ($${dailyBudgetUsd().toFixed(2)}) has been reached. New AI turns resume at 00:00 UTC.`, false);
  }
}

export async function recordUsage(r: { sessionId: string | null; provider: LlmProvider | { id: string; pricing: { inputPerM: number; outputPerM: number } }; kind: string; model: string; inputTokens: number; outputTokens: number; characters?: number; usdOverride?: number; success: boolean }) {
  const est = r.usdOverride ?? (r.inputTokens * r.provider.pricing.inputPerM + r.outputTokens * r.provider.pricing.outputPerM) / 1e6;
  await db().usageRecord.create({
    data: { sessionId: r.sessionId, provider: r.provider.id, kind: r.kind, model: r.model, inputTokens: r.inputTokens, outputTokens: r.outputTokens, characters: r.characters ?? 0, estimatedUsd: est, success: r.success },
  });
}
