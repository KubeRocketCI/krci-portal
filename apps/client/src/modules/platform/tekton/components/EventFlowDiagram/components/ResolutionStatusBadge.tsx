import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ResolutionStatus } from "@/modules/platform/tekton/hooks/useEventListenerTopology";

const RESTRICTED_HINT =
  "Couldn't load this resource — your role may lack permission, or the CRD is not installed. The reference may still be valid in the cluster.";

export const ResolutionStatusBadge = ({
  status,
  resourceLabel,
  className = "text-xs",
}: {
  status: ResolutionStatus;
  resourceLabel?: string;
  className?: string;
}) => {
  if (status === "resolved") return null;
  if (status === "missing") {
    return (
      <Badge variant="warning" className={className}>
        missing
      </Badge>
    );
  }
  return (
    <Tooltip title={resourceLabel ? `${RESTRICTED_HINT} (${resourceLabel})` : RESTRICTED_HINT}>
      <Badge variant="neutral" className={className}>
        restricted
      </Badge>
    </Tooltip>
  );
};
