import type { SecuritySeverity } from "@my-project/shared";

/** One bar of a chart: severity counts plus bookkeeping for the tooltip. */
export type ChartRow = Record<SecuritySeverity, number> & {
  key: string;
  label: string;
  total: number;
  /** 1 for an entry without findings: fills the bar with an empty track under percent stacking. */
  empty: number;
  [field: string]: string | number | undefined;
};
