import { getTotalCount } from "@/modules/platform/security/components/defectdojo/utils";
import type { FindingsEntry } from "../../utils";
import type { ChartRow } from "./types";

export const BAR_SIZE = 20;
export const ROW_HEIGHT = 28;
export const AXIS_HEIGHT = 30;

export const getChartHeight = (rowCount: number, rowHeight: number = ROW_HEIGHT): number =>
  rowCount * rowHeight + AXIS_HEIGHT;

export const toChartRow = (entry: FindingsEntry): ChartRow => {
  const total = getTotalCount(entry.counts);
  return {
    ...entry.counts,
    key: entry.key,
    label: entry.label,
    total,
    empty: total === 0 ? 1 : 0,
  };
};
