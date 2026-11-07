/**
 * NEAR Value Accrual / Break-Even Demand Model.
 *
 * Pure, deterministic functions. No I/O. Shared by the worker, the API, the browser
 * calculator and `npm run research:refresh`, so every surface computes the same numbers.
 *
 * This model does NOT forecast price. It answers: how much measurable activity would be
 * needed for buybacks funded by NEAR Intents revenue to reach a hypothetical share of
 * market capitalization each year?
 *
 *   annual_buyback_demand_usd        = V * f * c * b
 *   buyback_demand_to_mcap           = annual_buyback_demand_usd / M
 *   break_even_required_annual_volume = (y * M) / (f * c * b)
 *   volume_multiple_required          = break_even_required_annual_volume / V
 */

export const FORMULA_VERSION = 'nvabe-1.0.0';

export type InputKind = 'OBSERVED' | 'DERIVED' | 'REPORTED' | 'ASSUMED';

export interface ModelInput {
  /** Value in base units: USD for M and V, a fraction (0..1) for f, c, b and y. */
  value: number | null;
  kind: InputKind;
  /** Evidence IDs the value comes from. Empty for pure assumptions. */
  evidenceIds: string[];
  note?: string;
}

export interface ModelInputs {
  M: ModelInput;
  V: ModelInput;
  f: ModelInput;
  c: ModelInput;
  b: ModelInput;
  y: ModelInput;
}

export type NAReason =
  | { code: 'missing'; input: keyof ModelInputs }
  | { code: 'nonpositive'; input: keyof ModelInputs }
  | { code: 'out_of_range'; input: keyof ModelInputs };

export interface ModelOutputs {
  annualBuybackDemandUsd: number | null;
  buybackDemandToMcap: number | null;
  breakEvenAnnualVolumeUsd: number | null;
  volumeMultipleRequired: number | null;
  /** f * c * b: the share of each dollar of volume that becomes buyback demand. */
  volumeToBuybackRate: number | null;
  na: Partial<Record<keyof ModelOutputsNumeric, NAReason[]>>;
}

type ModelOutputsNumeric = Omit<ModelOutputs, 'na'>;

const FRACTION_INPUTS: (keyof ModelInputs)[] = ['f', 'c', 'b', 'y'];

/** Validates one input. Returns problems, never throws, never substitutes a value. */
export function checkInput(name: keyof ModelInputs, input: ModelInput | undefined): NAReason[] {
  if (!input || input.value === null || input.value === undefined || !Number.isFinite(input.value)) {
    return [{ code: 'missing', input: name }];
  }
  if (input.value <= 0) return [{ code: 'nonpositive', input: name }];
  if (FRACTION_INPUTS.includes(name) && input.value > 1) return [{ code: 'out_of_range', input: name }];
  return [];
}

export function computeModel(inputs: ModelInputs): ModelOutputs {
  const issues = Object.fromEntries(
    (Object.keys(inputs) as (keyof ModelInputs)[]).map((k) => [k, checkInput(k, inputs[k])]),
  ) as Record<keyof ModelInputs, NAReason[]>;
  const ok = (...keys: (keyof ModelInputs)[]) => keys.every((k) => issues[k].length === 0);
  const why = (...keys: (keyof ModelInputs)[]) => keys.flatMap((k) => issues[k]);
  const v = (k: keyof ModelInputs) => inputs[k].value as number;

  const out: ModelOutputs = {
    annualBuybackDemandUsd: null,
    buybackDemandToMcap: null,
    breakEvenAnnualVolumeUsd: null,
    volumeMultipleRequired: null,
    volumeToBuybackRate: null,
    na: {},
  };

  if (ok('f', 'c', 'b')) out.volumeToBuybackRate = v('f') * v('c') * v('b');
  else out.na.volumeToBuybackRate = why('f', 'c', 'b');

  if (ok('V', 'f', 'c', 'b')) out.annualBuybackDemandUsd = v('V') * v('f') * v('c') * v('b');
  else out.na.annualBuybackDemandUsd = why('V', 'f', 'c', 'b');

  if (ok('V', 'f', 'c', 'b', 'M')) out.buybackDemandToMcap = (out.annualBuybackDemandUsd as number) / v('M');
  else out.na.buybackDemandToMcap = why('V', 'f', 'c', 'b', 'M');

  if (ok('y', 'M', 'f', 'c', 'b')) out.breakEvenAnnualVolumeUsd = (v('y') * v('M')) / (v('f') * v('c') * v('b'));
  else out.na.breakEvenAnnualVolumeUsd = why('y', 'M', 'f', 'c', 'b');

  if (ok('y', 'M', 'f', 'c', 'b', 'V')) out.volumeMultipleRequired = (out.breakEvenAnnualVolumeUsd as number) / v('V');
  else out.na.volumeMultipleRequired = why('y', 'M', 'f', 'c', 'b', 'V');

  return out;
}

/**
 * Reverse calculator: the product f*c*b needed for volume V to fund buybacks equal to
 * y of market cap. Useful when f or c cannot be observed; it states a requirement, not a fact.
 */
export function requiredTakeRate(V: number | null, M: number | null, y: number | null): number | null {
  if (V === null || M === null || y === null) return null;
  if (!(V > 0) || !(M > 0) || !(y > 0) || y > 1) return null;
  return (y * M) / V;
}

/** Same as requiredTakeRate, solved for one factor given the other two. */
export function requiredFactor(
  solveFor: 'f' | 'c' | 'b',
  known: { V: number | null; M: number | null; y: number | null; f?: number | null; c?: number | null; b?: number | null },
): number | null {
  const product = requiredTakeRate(known.V, known.M, known.y);
  if (product === null) return null;
  const others = (['f', 'c', 'b'] as const).filter((k) => k !== solveFor).map((k) => known[k]);
  if (others.some((x) => x === null || x === undefined || !(x > 0) || x > 1)) return null;
  return product / (others as number[]).reduce((a, x) => a * x, 1);
}

// ------------------------------------------------------------------ scenarios

export interface ScenarioAdjustments {
  /** Fee compression: f is multiplied by (1 - feeCompression). 0.25 = fees fall 25%. */
  feeCompression: number;
  /** Capture haircut: c is multiplied by (1 - captureHaircut). */
  captureHaircut: number;
  /** Buyback allocation override; null keeps the base b. */
  buybackShare: number | null;
  /** Volume growth applied to annualized V: V * (1 + volumeGrowth). */
  volumeGrowth: number;
  /** Target annual buyback demand as a fraction of market cap. */
  targetBuybackToMcap: number;
}

export interface ScenarioDef {
  key: 'conservative' | 'base' | 'optimistic';
  label: string;
  rationale: string;
  adjustments: ScenarioAdjustments;
}

/**
 * Fixed scenario presets. Every adjustment is an ASSUMPTION and is labelled as one.
 * They were set before looking at model output and are shown with the results.
 */
export const SCENARIOS: ScenarioDef[] = [
  {
    key: 'conservative',
    label: 'Conservative',
    rationale: 'Fees compress by half as competitors undercut, NEAR keeps 25% less of fees, half of captured revenue goes to buybacks, and volume does not grow.',
    adjustments: { feeCompression: 0.5, captureHaircut: 0.25, buybackShare: 0.5, volumeGrowth: 0, targetBuybackToMcap: 0.02 },
  },
  {
    key: 'base',
    label: 'Base',
    rationale: 'Measured fee rate, capture and buyback share held constant, and the trailing 90-day volume run rate held flat.',
    adjustments: { feeCompression: 0, captureHaircut: 0, buybackShare: null, volumeGrowth: 0, targetBuybackToMcap: 0.02 },
  },
  {
    key: 'optimistic',
    label: 'Optimistic',
    rationale: 'Measured fee rate and capture held, all captured revenue goes to buybacks, and volume doubles.',
    adjustments: { feeCompression: 0, captureHaircut: 0, buybackShare: 1, volumeGrowth: 1, targetBuybackToMcap: 0.02 },
  },
];

export function applyAdjustments(base: ModelInputs, adj: ScenarioAdjustments): ModelInputs {
  const scale = (input: ModelInput, factor: number, note: string): ModelInput =>
    factor === 1 || input.value === null
      ? input
      : { value: input.value * factor, kind: 'ASSUMED', evidenceIds: input.evidenceIds, note };
  return {
    M: base.M,
    V: scale(base.V, 1 + adj.volumeGrowth, `Measured run rate x ${(1 + adj.volumeGrowth).toFixed(2)} (assumed growth)`),
    f: scale(base.f, 1 - adj.feeCompression, `Measured fee rate x ${(1 - adj.feeCompression).toFixed(2)} (assumed compression)`),
    c: scale(base.c, 1 - adj.captureHaircut, `Measured capture x ${(1 - adj.captureHaircut).toFixed(2)} (assumed haircut)`),
    b: adj.buybackShare === null ? base.b : { value: adj.buybackShare, kind: 'ASSUMED', evidenceIds: [], note: 'Hypothetical buyback allocation policy' },
    y: { value: adj.targetBuybackToMcap, kind: 'ASSUMED', evidenceIds: [], note: 'Hypothetical target, not a policy' },
  };
}

export interface ScenarioRun {
  key: string;
  label: string;
  rationale: string;
  adjustments: ScenarioAdjustments;
  inputs: ModelInputs;
  outputs: ModelOutputs;
}

export function runScenarios(base: ModelInputs, defs: ScenarioDef[] = SCENARIOS): ScenarioRun[] {
  return defs.map((d) => {
    const inputs = applyAdjustments(base, d.adjustments);
    return { key: d.key, label: d.label, rationale: d.rationale, adjustments: d.adjustments, inputs, outputs: computeModel(inputs) };
  });
}

export interface SensitivityMatrix {
  rowLabel: string;
  colLabel: string;
  rows: number[];
  cols: number[];
  /** cells[r][c] = volume multiple required, or null when N/A. */
  cells: (number | null)[][];
}

/** Required volume multiple across fee compression (rows) and target buyback/mcap (cols). */
export function sensitivity(
  base: ModelInputs,
  rows: number[] = [0, 0.25, 0.5, 0.75],
  cols: number[] = [0.005, 0.01, 0.02, 0.05],
): SensitivityMatrix {
  const cells = rows.map((fc) =>
    cols.map((y) =>
      computeModel(applyAdjustments(base, { feeCompression: fc, captureHaircut: 0, buybackShare: null, volumeGrowth: 0, targetBuybackToMcap: y }))
        .volumeMultipleRequired,
    ),
  );
  return { rowLabel: 'Fee compression', colLabel: 'Target buyback / market cap', rows, cols, cells };
}

/** Required volume multiple across buyback allocation (rows) and capture haircut (cols), at a fixed target. */
export function allocationSensitivity(
  base: ModelInputs,
  target = 0.02,
  rows: number[] = [0.25, 0.5, 0.75, 1],
  cols: number[] = [0, 0.25, 0.5],
): SensitivityMatrix {
  const cells = rows.map((b) =>
    cols.map((h) =>
      computeModel(applyAdjustments(base, { feeCompression: 0, captureHaircut: h, buybackShare: b, volumeGrowth: 0, targetBuybackToMcap: target }))
        .volumeMultipleRequired,
    ),
  );
  return { rowLabel: 'Buyback share of captured revenue', colLabel: 'Capture haircut', rows, cols, cells };
}
