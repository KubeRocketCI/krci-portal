import { SEVERITY_SERIES } from "../../constants";
import { formatPercent } from "../../utils";
import type { ChartRow } from "./types";

interface SeverityTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}

/** Exact counts, share and total of the hovered bar. */
export function SeverityTooltip({ active, payload }: SeverityTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) {
    return null;
  }

  return (
    <div className="bg-background max-w-xs rounded-lg border p-3 text-sm shadow-md">
      <p className="font-medium break-all">{row.label}</p>
      {row.total === 0 ? (
        <p className="text-muted-foreground mt-1">No findings</p>
      ) : (
        <>
          <ul className="mt-2 flex flex-col gap-1">
            {SEVERITY_SERIES.filter(({ key }) => row[key] > 0).map(({ key, label, color }) => (
              <li key={key} className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                <span>{label}</span>
                <span className="ml-auto pl-4 font-semibold tabular-nums">{row[key].toLocaleString("en")}</span>
                <span className="text-muted-foreground w-10 text-right tabular-nums">
                  {formatPercent(row[key], row.total)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 border-t pt-2">
            Total <span className="text-foreground font-semibold tabular-nums">{row.total.toLocaleString("en")}</span>
          </p>
        </>
      )}
    </div>
  );
}
