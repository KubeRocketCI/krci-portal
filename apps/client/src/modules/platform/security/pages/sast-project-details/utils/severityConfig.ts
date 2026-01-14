import { AlertCircle, AlertOctagon, AlertTriangle, Info, XCircle } from "lucide-react";
import { IssueSeverity } from "@my-project/shared";

/**
 * Severity configuration with icons and colors
 */
export const SEVERITY_CONFIG = {
  BLOCKER: {
    label: "Blocker",
    icon: XCircle,
    badgeVariant: "destructive" as const,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  CRITICAL: {
    label: "Critical",
    icon: AlertOctagon,
    badgeVariant: "destructive" as const,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  MAJOR: {
    label: "Major",
    icon: AlertTriangle,
    badgeVariant: "default" as const,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  MINOR: {
    label: "Minor",
    icon: AlertCircle,
    badgeVariant: "secondary" as const,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  INFO: {
    label: "Info",
    icon: Info,
    badgeVariant: "outline" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
} as const;

/**
 * Get severity configuration by severity level
 */
export function getSeverityConfig(severity: IssueSeverity) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO;
}
