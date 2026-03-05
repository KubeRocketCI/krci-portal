import { Eye, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Stage } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeCDPipelineDetails } from "../../../route";

interface FooterProps {
  stage: Stage;
}

export function Footer({ stage }: FooterProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();

  const linkParams = {
    clusterName,
    cdPipeline: params.name,
    namespace: params.namespace,
    stage: stage.spec.name,
  };

  return (
    <div className="bg-muted/50 border-border flex items-center gap-2 border-t px-5 py-3">
      <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
        <Link to={PATH_CDPIPELINE_STAGE_DETAILS_FULL} params={linkParams}>
          <Eye className="size-3" /> View Details
        </Link>
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
        <Settings className="size-3" /> Configure & Deploy
      </Button>
    </div>
  );
}
