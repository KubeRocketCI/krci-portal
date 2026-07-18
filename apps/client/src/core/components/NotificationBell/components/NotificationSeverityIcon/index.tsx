import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import type { ComponentType } from "react";
import type { NotificationSeverity } from "@my-project/shared";
import { cn } from "@/core/utils/classname";

const ICON_BY_SEVERITY: Record<NotificationSeverity, ComponentType<{ className?: string }>> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

// Same status color tokens as the Badge severity variants.
const COLOR_CLASS_BY_SEVERITY: Record<NotificationSeverity, string> = {
  success: "text-status-success",
  error: "text-status-error",
  warning: "text-status-missing",
  info: "text-status-in-progress",
};

export function NotificationSeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const Icon = ICON_BY_SEVERITY[severity];

  return <Icon className={cn("h-4 w-4 shrink-0", COLOR_CLASS_BY_SEVERITY[severity])} aria-hidden="true" />;
}
