import { Link } from "@tanstack/react-router";
import { ArrowRight, Layers } from "lucide-react";
import { Stage } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { routeCDPipelineDetails } from "../../../route";
import { ExternalServices } from "./ExternalServices";

interface HeaderProps {
  stage: Stage;
}

export function Header({ stage }: HeaderProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();

  const linkParams = {
    clusterName,
    cdPipeline: params.name,
    namespace: params.namespace,
    stage: stage.spec.name,
  };

  return (
    <div className="border-border flex flex-col border-b">
      <div className="bg-primary flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
            <Layers className="size-4 text-white" />
          </div>
          <div>
            <Button
              variant="link"
              asChild
              className="h-auto !p-0 text-2xl font-semibold text-white underline hover:text-white/80"
            >
              <Link to={PATH_CDPIPELINE_STAGE_DETAILS_FULL} params={linkParams}>
                {stage.spec.name}
                <ArrowRight />
              </Link>
            </Button>
            <p className="text-primary-foreground/80 text-xs">{stage.spec.description || "No description"}</p>
          </div>
        </div>
      </div>
      <ExternalServices stage={stage} />
    </div>
  );
}
