import { type BadgeProps } from "@/core/components/ui/badge";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";

export const statusBadgeVariants: Record<string, BadgeProps["variant"]> = {
  [CUSTOM_RESOURCE_STATUS.CREATED]: "success",
  [CUSTOM_RESOURCE_STATUS.FAILED]: "error",
  [CUSTOM_RESOURCE_STATUS.IN_PROGRESS]: "info",
  [CUSTOM_RESOURCE_STATUS.INITIALIZED]: "warning",
};

export function getStatusBadgeVariant(status: string | undefined): BadgeProps["variant"] {
  return (status && statusBadgeVariants[status]) || "neutral";
}

export function formatStatusText(status: string | undefined): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("-", " ");
}
