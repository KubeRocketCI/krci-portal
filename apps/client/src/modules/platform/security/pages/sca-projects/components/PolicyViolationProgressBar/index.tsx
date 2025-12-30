import { VIOLATION_COLORS } from "@/modules/platform/security/pages/sca/constants/colors";
import { DependencyTrackProjectMetrics } from "@my-project/shared";
import {
  StackedProgressBar,
  ProgressSegment,
} from "@/modules/platform/security/pages/sca/components/shared/StackedProgressBar";

export interface PolicyViolationProgressBarProps {
  metrics: DependencyTrackProjectMetrics;
}

/**
 * Displays policy violation breakdown as a stacked progress bar
 * Shows Info (blue), Warn (yellow), Fail (red)
 * Tooltip displays violation types (License, Operational, Security) and states
 */
export function PolicyViolationProgressBar({ metrics }: PolicyViolationProgressBarProps) {
  const total = metrics.policyViolationsTotal;
  const info = metrics.policyViolationsInfo;
  const warn = metrics.policyViolationsWarn;
  const fail = metrics.policyViolationsFail;

  const segments: ProgressSegment[] = [
    { value: info, color: VIOLATION_COLORS.INFO, label: "Info" },
    { value: warn, color: VIOLATION_COLORS.WARN, label: "Warn" },
    { value: fail, color: VIOLATION_COLORS.FAIL, label: "Fail" },
  ];

  const tooltip = (
    <div className="text-left">
      <h5 className="mb-2 font-semibold">Type</h5>
      <div className="space-y-1 text-sm">
        <p>License: {metrics.policyViolationsLicenseTotal}</p>
        <p>Operational: {metrics.policyViolationsOperationalTotal}</p>
        <p>Security: {metrics.policyViolationsSecurityTotal}</p>
      </div>

      <h5 className="mt-3 mb-2 font-semibold">Violation State</h5>
      <div className="space-y-1 text-sm">
        <p>Info: {info}</p>
        <p>Warn: {warn}</p>
        <p>Fail: {fail}</p>
      </div>

      <div className="mt-2 border-t pt-2 text-sm font-semibold">Total: {total}</div>
    </div>
  );

  return <StackedProgressBar segments={segments} total={total} tooltip={tooltip} />;
}
