/**
 * Re-export shared SeverityBadge component
 * Use the "solid" variant for white text on colored background
 */
import { SeverityBadge as SharedSeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";

interface SeverityBadgeProps {
  severity: string | undefined;
}

/**
 * Badge component displaying vulnerability severity with appropriate color
 * Wraps the shared SeverityBadge with "solid" variant for backward compatibility
 */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return <SharedSeverityBadge severity={severity || "UNKNOWN"} variant="solid" />;
}
