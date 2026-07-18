import type { NotificationSeverity } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { SEVERITY_ICON, SEVERITY_ICON_COLOR_CLASS } from "@/core/utils/severity";

export function NotificationSeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const Icon = SEVERITY_ICON[severity];

  return <Icon className={cn("h-4 w-4 shrink-0", SEVERITY_ICON_COLOR_CLASS[severity])} aria-hidden="true" />;
}
