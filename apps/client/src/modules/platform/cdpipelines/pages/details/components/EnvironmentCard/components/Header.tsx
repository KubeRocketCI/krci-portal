import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Zap, Pause, Layers, Shield, Clock } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Stage } from "@my-project/shared";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";

interface HeaderProps {
  stage: Stage;
  isExpanded: boolean;
  onToggleExpand: () => void;
  linkParams: {
    clusterName: string;
    cdPipeline: string;
    namespace: string;
    stage: string;
  };
}

export const Header = ({ stage, isExpanded, onToggleExpand, linkParams }: HeaderProps) => {
  const qualityGates = stage.spec.qualityGates || [];
  const triggerTypeLower = stage.spec.triggerType.toLowerCase();
  const isAutoTrigger = triggerTypeLower === "auto" || triggerTypeLower === "auto-stable";

  return (
    <div className="bg-card w-full border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onToggleExpand} className="h-10 w-10 p-1">
            {isExpanded ? (
              <ChevronDown className="text-muted-foreground size-5" />
            ) : (
              <ChevronRight className="text-muted-foreground size-5" />
            )}
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              <Layers className="text-primary size-5" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Button variant="link" asChild className="text-foreground h-auto p-0 text-2xl font-normal">
                  <Link to={PATH_CDPIPELINE_STAGE_DETAILS_FULL} params={linkParams}>
                    {stage.spec.name}
                  </Link>
                </Button>
                <Badge
                  variant="outline"
                  className={`capitalize ${
                    isAutoTrigger
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                      : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
                  }`}
                >
                  {isAutoTrigger ? <Zap className="mr-1 size-3" /> : <Pause className="mr-1 size-3" />}
                  {stage.spec.triggerType}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{stage.spec.description || "No description"}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-8">
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              <Shield className="size-3" />
              Quality Gates
            </div>
            <div className="text-foreground text-sm">{qualityGates.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              <Clock className="size-3" />
              Last Deployment
            </div>
            <div className="text-foreground text-sm">N/A</div>
          </div>
        </div>
      </div>
    </div>
  );
};
