import type { SecuritySeverity } from "@my-project/shared";
import { SEVERITY_COLORS } from "@/modules/platform/security/constants/severity";
import { SEVERITY_ROWS } from "@/modules/platform/security/components/defectdojo/utils";

const COLOR_BY_SEVERITY: Record<SecuritySeverity, string> = {
  critical: SEVERITY_COLORS.CRITICAL,
  high: SEVERITY_COLORS.HIGH,
  medium: SEVERITY_COLORS.MEDIUM,
  low: SEVERITY_COLORS.LOW,
  unassigned: SEVERITY_COLORS.UNASSIGNED,
};

/** Severities in display order with their fixed colours. */
export const SEVERITY_SERIES: ReadonlyArray<{ key: SecuritySeverity; label: string; color: string }> =
  SEVERITY_ROWS.map(({ key, label }) => ({ key, label, color: COLOR_BY_SEVERITY[key] }));
