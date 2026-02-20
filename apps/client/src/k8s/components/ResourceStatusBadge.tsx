import { Badge } from "@/core/components/ui/badge";
import { StatusIcon } from "@/core/components/StatusIcon";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { getStatusBadgeVariant, formatStatusText } from "@/k8s/utils/status-badge";

interface ResourceStatusBadgeProps {
  status: string | undefined;
  detailedMessage?: string;
  statusIcon: K8sResourceStatusIcon;
}

export const ResourceStatusBadge = ({ status, detailedMessage, statusIcon }: ResourceStatusBadgeProps) => {
  const statusText = formatStatusText(status);
  const badgeVariant = getStatusBadgeVariant(status);

  return (
    <Badge variant={badgeVariant} className="gap-1">
      <StatusIcon
        Icon={statusIcon.component}
        color="currentColor"
        isSpinning={statusIcon.isSpinning}
        width={12}
        Title={
          <>
            <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
            {status === CUSTOM_RESOURCE_STATUS.FAILED && detailedMessage && (
              <p className="mt-3 text-sm font-medium">{detailedMessage}</p>
            )}
          </>
        }
      />
      {statusText}
    </Badge>
  );
};
