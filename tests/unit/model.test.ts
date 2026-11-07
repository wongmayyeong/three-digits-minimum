import { describe, expect, it } from 'vitest';
import { allocationSensitivity, applyAdjustments, computeModel, requiredFactor, requiredTakeRate, runScenarios, sensitivity, type ModelInputs } from '@/lib/research/model';

const obs = (value: number | null, kind: 'OBSERVED' | 'DERIVED' | 'ASSUMED' = 'OBSERVED') => ({ value, kind, evidenceIds: [] });

// Hand-computed case:
// V = $40B, f = 0.15%, c = 30%, b = 100%, M = $5B, y = 2%
// demand = 40e9 * 0.0015 * 0.3 * 1 = $18M; demand/M = 0.36%
// break-even = 0.02 * 5e9 / (0.0015 * 0.3) = 1e8 / 0.00045 = $222.22B; multiple = 5.5556
const base: ModelInputs = { M: obs(5e9), V: obs(40e9, 'DERIVED'), f: obs(0.0015, 'DERIVED'), c: obs(0.3, 'DERIVED'), b: obs(1, 'DERIVED'), y: obs(0.02, 'ASSUMED') };

describe('break-even demand model', () => {
  it('matches the hand-computed case', () => {
    const o = computeModel(base);
    expect(o.annualBuybackDemandUsd).toBeCloseTo(18e6, 6);
    expect(o.buybackDemandToMcap).toBeCloseTo(0.0036, 12);
    expect(o.breakEvenAnnualVolumeUsd).toBeCloseTo(222_222_222_222.22, 0);
    expect(o.volumeMultipleRequired).toBeCloseTo(5.555555, 5);
    expect(o.volumeToBuybackRate).toBeCloseTo(0.00045, 12);
    expect(o.na).toEqual({});
  });

  it('is dimensionally consistent: demand at break-even volume equals y * M', () => {
    const o = computeModel(base);
    const atBreakEven = computeModel({ ...base, V: obs(o.breakEvenAnnualVolumeUsd) });
    expect(atBreakEven.buybackDemandToMcap).toBeCloseTo(0.02, 12);
    expect(atBreakEven.volumeMultipleRequired).toBeCloseTo(1, 12);
  });

  it('returns N/A with reasons instead of dividing by zero', () => {
    const o = computeModel({ ...base, f: obs(0) });
    expect(o.breakEvenAnnualVolumeUsd).toBeNull();
    expect(o.annualBuybackDemandUsd).toBeNull();
    expect(o.na.breakEvenAnnualVolumeUsd).toContainEqual({ code: 'nonpositive', input: 'f' });
  });

  it('treats missing inputs as N/A and never substitutes', () => {
    const o = computeModel({ ...base, c: obs(null) });
    expect(o.annualBuybackDemandUsd).toBeNull();
    expect(o.na.annualBuybackDemandUsd).toContainEqual({ code: 'missing', input: 'c' });
    const m = computeModel({ ...base, M: obs(null) });
    expect(m.annualBuybackDemandUsd).toBeCloseTo(18e6, 6);
    expect(m.buybackDemandToMcap).toBeNull();
    expect(m.breakEvenAnnualVolumeUsd).toBeNull();
  });

  it('rejects fractions above 100% and non-finite inputs', () => {
    expect(computeModel({ ...base, b: obs(1.2) }).na.annualBuybackDemandUsd).toContainEqual({ code: 'out_of_range', input: 'b' });
    expect(computeModel({ ...base, V: obs(Number.NaN) }).annualBuybackDemandUsd).toBeNull();
    expect(computeModel({ ...base, V: obs(Number.POSITIVE_INFINITY) }).annualBuybackDemandUsd).toBeNull();
  });

  it('reverse calculator solves the required take rate and single factors', () => {
    expect(requiredTakeRate(40e9, 5e9, 0.02)).toBeCloseTo(0.0025, 12);
    expect(requiredFactor('b', { V: 40e9, M: 5e9, y: 0.02, f: 0.0015, c: 0.3 })).toBeCloseTo(5.5556, 4);
    expect(requiredFactor('f', { V: 40e9, M: 5e9, y: 0.02, c: 0.3, b: 1 })).toBeCloseTo(0.008333, 6);
    expect(requiredTakeRate(0, 5e9, 0.02)).toBeNull();
    expect(requiredFactor('c', { V: 40e9, M: 5e9, y: 0.02, f: 0, b: 1 })).toBeNull();
  });
});

describe('scenarios and sensitivity', () => {
  it('fee compression scales demand linearly and the required multiple inversely', () => {
    const half = computeModel(applyAdjustments(base, { feeCompression: 0.5, captureHaircut: 0, buybackShare: null, volumeGrowth: 0, targetBuybackToMcap: 0.02 }));
    expect(half.annualBuybackDemandUsd).toBeCloseTo(9e6, 6);
    expect(half.volumeMultipleRequired).toBeCloseTo(11.1111, 4);
  });

  it('buyback allocation override is labelled ASSUMED', () => {
    const adj = applyAdjustments(base, { feeCompression: 0, captureHaircut: 0, buybackShare: 0.5, volumeGrowth: 0, targetBuybackToMcap: 0.02 });
    expect(adj.b.kind).toBe('ASSUMED');
    expect(adj.b.value).toBe(0.5);
    expect(adj.f.kind).toBe('DERIVED');
  });

  it('volume growth changes the multiple but not the break-even volume', () => {
    const [cons, b, opt] = runScenarios(base);
    expect(b!.outputs.breakEvenAnnualVolumeUsd).toBeCloseTo(opt!.outputs.breakEvenAnnualVolumeUsd!, 0);
    expect(opt!.outputs.volumeMultipleRequired).toBeCloseTo(b!.outputs.volumeMultipleRequired! / 2, 9);
    expect(cons!.outputs.annualBuybackDemandUsd!).toBeLessThan(b!.outputs.annualBuybackDemandUsd!);
  });

  it('sensitivity matrices are monotonic', () => {
    const m = sensitivity(base);
    for (let r = 1; r < m.rows.length; r++) expect(m.cells[r]![0]!).toBeGreaterThan(m.cells[r - 1]![0]!);
    for (let c = 1; c < m.cols.length; c++) expect(m.cells[0]![c]!).toBeGreaterThan(m.cells[0]![c - 1]!);
    const a = allocationSensitivity(base);
    expect(a.cells[0]![0]!).toBeGreaterThan(a.cells[3]![0]!);
  });

  it('full fee compression yields N/A, not infinity', () => {
    const m = sensitivity(base, [1], [0.02]);
    expect(m.cells[0]![0]).toBeNull();
  });
});
