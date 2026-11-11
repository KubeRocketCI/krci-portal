import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/core/components/ui/button";
import { COLLAPSED_ENTRY_COUNT, limitEntries, type FindingsEntry, type FindingsScope } from "../../utils";
import { AXIS_LINE_STROKE, AXIS_TICK, CURSOR_FILL, EMPTY_TRACK_FILL, GRID_STROKE } from "./chartTheme";
import { ChartCard } from "./ChartCard";
import { EntryTick } from "./EntryTick";
import { renderSeverityBars } from "./renderSeverityBars";
import { SeverityLegend } from "./SeverityLegend";
import { SeverityTooltip } from "./SeverityTooltip";
import { BAR_SIZE, getChartHeight, toChartRow } from "./utils";

const PERCENT_TICKS = [0, 0.25, 0.5, 0.75, 1];

const formatPercentTick = (value: number): string => `${Math.round(value * 100)}%`;

const formatEmptyLabel = (value: unknown): string => (value ? "No findings" : "");

interface EntryCompositionCardProps {
  /** Ordered by severity. */
  entries: FindingsEntry[];
  scope: FindingsScope;
}

/** Severity mix of every CI entry or environment as 100% stacked bars. */
export function EntryCompositionCard({ entries, scope }: EntryCompositionCardProps) {
  const [showAll, setShowAll] = useState(false);

  const canExpand = entries.length > COLLAPSED_ENTRY_COUNT;
  const { visible, other } = limitEntries(entries, showAll ? entries.length : COLLAPSED_ENTRY_COUNT);
  const rows = (other ? [...visible, other] : visible).map(toChartRow);
  const noun = scope === "runtime" ? "environments" : "CI scans";

  return (
    <ChartCard
      title={scope === "runtime" ? "Composition per environment" : "Composition per CI scan"}
      description="Share of each severity within an entry. Hover a bar for exact counts."
    >
      <SeverityLegend />
      <div className={showAll ? "max-h-[360px] overflow-y-auto" : undefined}>
        <div
          role="img"
          aria-label={`Severity composition of ${entries.length} ${noun}, most severe first. The lists below hold the exact counts.`}
        >
          <ResponsiveContainer width="100%" height={getChartHeight(rows.length)}>
            <BarChart
              data={rows}
              layout="vertical"
              stackOffset="expand"
              margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              barSize={BAR_SIZE}
              accessibilityLayer={false}
            >
              <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 1]}
                ticks={PERCENT_TICKS}
                tickFormatter={formatPercentTick}
                tick={AXIS_TICK}
                axisLine={{ stroke: AXIS_LINE_STROKE }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={180}
                interval={0}
                tick={<EntryTick />}
                axisLine={{ stroke: AXIS_LINE_STROKE }}
                tickLine={false}
              />
              <Tooltip content={<SeverityTooltip />} cursor={{ fill: CURSOR_FILL, opacity: 0.4 }} />
              {renderSeverityBars("composition")}
              <Bar
                dataKey="empty"
                name="No findings"
                stackId="composition"
                fill={EMPTY_TRACK_FILL}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="empty"
                  position="center"
                  formatter={formatEmptyLabel}
                  fill={AXIS_TICK.fill}
                  fontSize={AXIS_TICK.fontSize}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {canExpand && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          aria-expanded={showAll}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? `Show top ${COLLAPSED_ENTRY_COUNT}` : `Show all (${entries.length})`}
        </Button>
      )}
    </ChartCard>
  );
}
