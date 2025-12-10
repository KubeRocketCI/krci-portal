import { Link } from "@tanstack/react-router";
import { Eye, Settings } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";

interface CardActionsProps {
  linkParams: {
    clusterName: string;
    cdPipeline: string;
    namespace: string;
    stage: string;
  };
}

export const CardActions = ({ linkParams }: CardActionsProps) => {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link to={PATH_CDPIPELINE_STAGE_DETAILS_FULL} params={linkParams}>
          <Eye className="mr-2 size-4" />
          View Details
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to={PATH_CDPIPELINE_STAGE_DETAILS_FULL} params={linkParams} search={{ tab: "applications" }}>
          <Settings className="mr-2 size-4" />
          Configure
        </Link>
      </Button>
    </div>
  );
};
