import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";

export const IngressHeadColumn = () => {
  return (
    <div className="flex flex-row flex-nowrap items-center gap-2">
      <div>URLs</div>
      <Tooltip
        title={
          <span>
            Application exposure endpoints.
            <br />
            <br />
            Shows external URLs from:
            <br />
            • Ingress resources (via Argo CD)
            <br />
            • HTTPRoute resources (via Gateway API)
            <br />
            <br />A ⚠ indicator means one or more routes have unresolved backends and may not serve traffic. HTTPRoute
            URLs appear only when Gateway API CRDs are installed on the cluster.
          </span>
        }
      >
        <Info size={16} />
      </Tooltip>
    </div>
  );
};
