import { PieChart, Pie, Label } from "recharts";
import React from "react";
import { cn } from "@/core/utils/classname";
import { ErrorContent } from "../ErrorContent";
import { RequestError } from "@/core/types/global";

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface PercentageCircleChartProps {
  title?: string | null;
  legend?: string | React.ReactNode | null;
  total?: number;
  data: ChartDataPoint[];
  BoxSx?: object;
  error?: RequestError | null;
  size?: number;
  dataKey?: string;
  label?: string | null;
  totalProps?: Record<string, unknown>;
  thickness?: number;
}

export const PercentageCircleChart = ({
  title,
  legend,
  total = 100,
  data,
  BoxSx,
  error,
  size = 200,
  dataKey = "percentage",
  label = "",
  totalProps = {},
  thickness = 16,
}: PercentageCircleChartProps) => {
  const chartSize = size * 0.8;
  const isLoading = total < 0;

  const fillColor = "#0094FF";
  const strokeColor = "#e0e0e0";
  const labelColor = "#424242";

  const formatData = () => {
    let filledValue = 0;

    const formatted = data.map((item) => {
      filledValue += item.value;
      return {
        percentage: (item.value / total) * 100,
        ...item,
      };
    });

    const remaining = {
      name: "total",
      percentage: total === 0 ? 100 : ((total - filledValue) / total) * 100,
      value: total,
      fill: strokeColor,
      ...totalProps,
    };

    return [...formatted, remaining];
  };

  return (
    <div className={cn("bg-card border p-6 shadow-xs", "rounded", "overflow-hidden", "h-full")}>
      <style>{`
        .percentage-chart-wrapper .recharts-sector {
          stroke: none;
        }
        .percentage-chart-wrapper .recharts-wrapper {
          width: 100% !important;
          height: 100% !important;
          line-height: 0;
        }
        .percentage-chart-wrapper .recharts-surface {
          width: 100%;
          height: 100%;
        }
      `}</style>
      <div className="percentage-chart-wrapper flex flex-col">
        <div className="flex flex-row items-center gap-4">
          {title && <h6 className="text-foreground text-lg font-medium">{title}</h6>}
        </div>
        {error ? (
          <ErrorContent error={error} orientation="vertical" />
        ) : (
          <div className="flex flex-row gap-4">
            <div style={BoxSx as React.CSSProperties}>
              <div aria-busy={isLoading} aria-live="polite" className="mx-auto flex items-center justify-center">
                <PieChart
                  cx={size / 2}
                  cy={size / 2}
                  width={chartSize}
                  height={chartSize}
                  className="mx-auto"
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Pie
                    data={formatData()}
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    innerRadius={chartSize * 0.47 - thickness}
                    outerRadius={chartSize * 0.47}
                    dataKey={dataKey}
                    startAngle={90}
                    endAngle={-270}
                    stroke={strokeColor}
                    fill={fillColor}
                  >
                    <Label
                      value={label || ""}
                      position="center"
                      style={{
                        fontSize: `${chartSize * 0.15}px`,
                        fill: labelColor,
                      }}
                    />
                  </Pie>
                </PieChart>
                {!isLoading && typeof legend === "string" && (
                  <p className="text-center text-[1.1em] font-normal">{legend}</p>
                )}
              </div>
            </div>
            {legend && typeof legend !== "string" && <div className="pt-4">{legend}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
