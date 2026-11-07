import { formatValue } from '@/lib/format';

interface Row {
  key: string;
  label: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

export function ScenarioTable({ scenarios }: { scenarios: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border hairline">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Scenario results of the break-even demand model</caption>
        <thead className="bg-raised text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-normal">Scenario</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Annual buyback demand</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Buyback / market cap</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Break-even volume (2%)</th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">Volume multiple</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.key} className="border-t hairline">
              <th scope="row" className="px-4 py-3 font-normal">
                <span className="font-[560]">{s.label}</span>
                {typeof s.inputs.rationale === 'string' && <p className="mt-0.5 max-w-sm text-xs leading-snug text-muted">{s.inputs.rationale}</p>}
              </th>
              <td className="num px-4 py-3 text-right">{formatValue(n(s.outputs.annualBuybackDemandUsd), 'USD')}</td>
              <td className="num px-4 py-3 text-right">{formatValue(n(s.outputs.buybackDemandToMcap), 'fraction')}</td>
              <td className="num px-4 py-3 text-right">{formatValue(n(s.outputs.breakEvenAnnualVolumeUsd), 'USD')}</td>
              <td className="num px-4 py-3 text-right">{formatValue(n(s.outputs.volumeMultipleRequired), 'ratio')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
