import { truncateMiddle } from "../../utils";
import { AXIS_TICK } from "./chartTheme";

const MAX_LABEL_LENGTH = 28;

interface EntryTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

/** Y-axis label of a bar: middle-truncated, full text in the native SVG tooltip. */
export function EntryTick({ x = 0, y = 0, payload }: EntryTickProps) {
  const label = payload?.value ?? "";

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text x={-8} dy={4} textAnchor="end" fill={AXIS_TICK.fill} fontSize={AXIS_TICK.fontSize}>
        {truncateMiddle(label, MAX_LABEL_LENGTH)}
      </text>
    </g>
  );
}
