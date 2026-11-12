import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THESIS_TOPIC } from '@/lib/topics/topics';

// The committed research output: every evidence ID the debate may cite must exist in it.
const canonical = JSON.parse(readFileSync('artifacts/research/canonical.json', 'utf8')) as { evidence: { evidenceId: string }[] };
const have = new Set(canonical.evidence.map((e) => e.evidenceId));

describe('debate topic', () => {
  it('cites only evidence IDs that the research produces', () => {
    const ids = [...THESIS_TOPIC.evidenceIds, ...THESIS_TOPIC.evidenceRequirements.flatMap((r) => r.evidenceIds)];
    expect([...new Set(ids)].filter((id) => !have.has(id))).toEqual([]);
  });
  it('never offers the withdrawn platform column or the old DEX total', () => {
    expect(THESIS_TOPIC.evidenceIds.some((id) => /SOLANA-(VOLUME|DEX-SHARE|CAGR)$|LAD-MULT-SOLANA|LAD-DEX-VOL-365D|TOK-NET-TO-HOLDERS|EXECUTED/.test(id))).toBe(false);
  });
});
