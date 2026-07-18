import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import type { ComponentType } from "react";

export type Severity = "success" | "error" | "warning" | "info";

export const SEVERITY_ICON: Record<Severity, ComponentType<{ className?: string }>> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

// Same status color tokens as the Badge severity variants.
export const SEVERITY_ICON_COLOR_CLASS: Record<Severity, string> = {
  success: "text-status-success",
  error: "text-status-error",
  warning: "text-status-missing",
  info: "text-status-in-progress",
};
