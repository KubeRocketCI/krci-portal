import { Bar } from "recharts";
import { SEVERITY_SERIES } from "../../constants";
import { SURFACE_STROKE } from "./chartTheme";

/** One stacked bar per severity. A function, not a component: recharts reads its children's types. */
export const renderSeverityBars = (stackId: string) =>
  SEVERITY_SERIES.map(({ key, label, color }) => (
    <Bar
      key={key}
      dataKey={key}
      name={label}
      stackId={stackId}
      fill={color}
      stroke={SURFACE_STROKE}
      strokeWidth={1}
      isAnimationActive={false}
    />
  ));
