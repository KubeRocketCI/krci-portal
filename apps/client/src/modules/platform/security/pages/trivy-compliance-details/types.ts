import { ControlResult } from "@my-project/shared";

/**
 * Extended control result for table display with additional computed fields
 */
export interface ControlTableRow extends ControlResult {
  /** Whether the control passed (totalFail === 0 or totalFail is undefined) */
  passed: boolean;
}

/**
 * Converts a ControlResult to ControlTableRow with computed fields
 */
export function toControlTableRow(control: ControlResult): ControlTableRow {
  return {
    ...control,
    passed: control.totalFail === undefined || control.totalFail === 0,
  };
}

/**
 * Severity counts for the breakdown component
 */
export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Calculate severity counts from control results
 * @param controls - Array of control results to count
 * @param filterFn - Optional filter function to count only matching controls (e.g., failed controls)
 */
export function calculateSeverityCounts(
  controls: ControlResult[],
  filterFn?: (control: ControlResult) => boolean
): SeverityCounts {
  const filteredControls = filterFn ? controls.filter(filterFn) : controls;

  return filteredControls.reduce(
    (acc, control) => {
      const severity = control.severity?.toUpperCase();
      switch (severity) {
        case "CRITICAL":
          acc.critical++;
          break;
        case "HIGH":
          acc.high++;
          break;
        case "MEDIUM":
          acc.medium++;
          break;
        case "LOW":
          acc.low++;
          break;
      }
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}
