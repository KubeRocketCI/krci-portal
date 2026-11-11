import { BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCount } from "@/modules/platform/security/components/defectdojo/utils";
import type { FindingsEntry } from "../../utils";
import { AXIS_LINE_STROKE, AXIS_TICK, CURSOR_FILL, GRID_STROKE } from "./chartTheme";
import { ChartCard } from "./ChartCard";
import { renderSeverityBars } from "./renderSeverityBars";
import { SeverityLegend } from "./SeverityLegend";
import { SeverityTooltip } from "./SeverityTooltip";
import { BAR_SIZE, getChartHeight, toChartRow } from "./utils";

const SCOPE_ROW_HEIGHT = 40;

interface ScopeComparisonCardProps {
  /** One entry per scope that has data: CI code, CI image, Runtime. */
  scopes: FindingsEntry[];
}

/** Absolute findings per scope. The same finding can appear in CI and at runtime. */
export function ScopeComparisonCard({ scopes }: ScopeComparisonCardProps) {
  const rows = scopes.map(toChartRow);
  const summary = rows.map((row) => `${row.label} ${row.total.toLocaleString("en")}`).join(", ");

  return (
    <ChartCard title="Scope comparison" description="Findings in CI scans and at runtime, on one scale.">
      <SeverityLegend />
      <div role="img" aria-label={`Findings per scope: ${summary}.`}>
        <ResponsiveContainer width="100%" height={getChartHeight(rows.length, SCOPE_ROW_HEIGHT)}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
            barSize={BAR_SIZE}
            accessibilityLayer={false}
          >
            <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
            <XAxis
              type="number"
              allowDecimals={false}
              tickFormatter={formatCount}
              tick={AXIS_TICK}
              axisLine={{ stroke: AXIS_LINE_STROKE }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={90}
              tick={AXIS_TICK}
              axisLine={{ stroke: AXIS_LINE_STROKE }}
              tickLine={false}
            />
            <Tooltip content={<SeverityTooltip />} cursor={{ fill: CURSOR_FILL, opacity: 0.4 }} />
            {renderSeverityBars("scope")}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
