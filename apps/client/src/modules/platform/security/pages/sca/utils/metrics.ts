import { PortfolioMetrics } from "@my-project/shared";

/**
 * Calculate percentage of value relative to total
 */
export function calculatePercent(total: number, value: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Get the most recent metrics from the array
 */
export function getLatestMetrics(metrics: PortfolioMetrics[] | undefined): PortfolioMetrics | null {
  if (!metrics || metrics.length === 0) return null;
  return metrics[metrics.length - 1];
}

/**
 * Format timestamp to readable date string
 */
export function formatLastMeasurement(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format timestamp for chart x-axis
 */
export function formatChartTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Chart data type with all metrics fields plus formatted timestamp
 */
export type ChartDataPoint = PortfolioMetrics & {
  timestamp: string;
  date: number;
};

/**
 * Transform metrics array to chart data format
 */
export function transformToChartData(metrics: PortfolioMetrics[]): ChartDataPoint[] {
  return metrics.map((m) => ({
    timestamp: formatChartTimestamp(m.firstOccurrence),
    date: m.firstOccurrence,
    ...m,
  }));
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}
