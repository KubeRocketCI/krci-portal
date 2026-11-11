import type { SecurityCounts } from "@my-project/shared";
import { DonutChart, type DonutSlice } from "@/core/components/charts/DonutChart";
import { formatCount, getTotalCount } from "@/modules/platform/security/components/defectdojo/utils";
import { SEVERITY_SERIES } from "../../constants";
import { formatPercent, getScopeSummary, type FindingsScope } from "../../utils";
import { ChartCard } from "./ChartCard";

interface SeverityDonutCardProps {
  counts: SecurityCounts;
  scope: FindingsScope;
}

export function SeverityDonutCard({ counts, scope }: SeverityDonutCardProps) {
  const total = getTotalCount(counts);
  const scopeLabel = scope === "runtime" ? "Runtime" : "CI";
  const slices: DonutSlice[] = SEVERITY_SERIES.map(({ key, label, color }) => ({
    name: label,
    value: counts[key],
    color,
  }));

  return (
    <ChartCard title="Severity composition" description={`${scopeLabel} findings by severity`}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div role="img" aria-label={`Severity composition, ${scopeLabel}: ${getScopeSummary(counts)}`}>
          <DonutChart
            data={slices}
            size={148}
            thickness={18}
            centerValue={<span title={total.toLocaleString("en")}>{formatCount(total)}</span>}
            centerLabel="Findings"
            centerValueClassName="text-2xl"
          />
        </div>
        <ul aria-label="Severity breakdown" className="flex min-w-48 flex-1 flex-col gap-1.5">
          {slices.map((slice) => (
            <li key={slice.name} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} aria-hidden />
              <span className="text-muted-foreground">{slice.name}</span>
              <span
                className="text-foreground ml-auto font-medium tabular-nums"
                title={slice.value.toLocaleString("en")}
              >
                {formatCount(slice.value)}
              </span>
              <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
                {formatPercent(slice.value, total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
