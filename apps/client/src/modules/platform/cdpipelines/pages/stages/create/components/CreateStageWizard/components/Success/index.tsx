import React from "react";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/core/components/ui/button";
import { PartyPopper, Check, ArrowRight, FolderOpen, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { NAMES } from "../../names";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { routeStageCreate, PATH_STAGE_CREATE_FULL } from "../../../../route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useWizardStore } from "../../store";
import { router } from "@/core/router";
import { useCreateStageForm } from "../../providers/form/hooks";

export const Success: React.FC = () => {
  const form = useCreateStageForm();
  const name = useStore(form.store, (state) => state.values[NAMES.name]);
  const { namespace, cdPipeline } = routeStageCreate.useParams();

  const { clusterName } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
    }))
  );

  const handleCreateAnother = React.useCallback(() => {
    useWizardStore.getState().reset();
    router.navigate({
      to: PATH_STAGE_CREATE_FULL,
      params: { clusterName, namespace, cdPipeline },
    });
  }, [clusterName, namespace, cdPipeline]);

  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 text-center">
        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
          <PartyPopper className="text-primary h-10 w-10" />
        </div>

        <div>
          <h1 className="text-foreground mb-2 text-xl font-semibold">Environment Created Successfully!</h1>
          <p className="text-muted-foreground text-sm">
            Your Environment <span className="text-foreground font-medium">{name || "environment"}</span> has been
            created and is ready to use
          </p>
        </div>

        <div className="border-border w-full border-t pt-4">
          <h3 className="text-foreground mb-4 text-base font-semibold">What would you like to do next?</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link to={routeCDPipelineDetails.fullPath} params={{ clusterName, namespace, name: cdPipeline }}>
                <FolderOpen className="text-muted-foreground h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">Back to Deployment</span>
                  <span className="text-muted-foreground text-[10px]">View deployment details</span>
                </div>
              </Link>
            </Button>

            <Button size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link
                to={routeStageDetails.fullPath}
                params={{
                  clusterName,
                  namespace,
                  cdPipeline,
                  stage: name || "",
                }}
              >
                <ExternalLink className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">Open Environment</span>
                  <span className="text-[10px] opacity-80">View environment details</span>
                </div>
              </Link>
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex h-auto flex-col items-center gap-1.5 py-3"
              onClick={handleCreateAnother}
            >
              <Sparkles className="text-muted-foreground h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-xs">Create Another Environment</span>
                <span className="text-muted-foreground text-[10px]">Start new wizard</span>
              </div>
            </Button>
          </div>
        </div>

        <div className="border-border bg-muted/50 w-full rounded-lg border p-4">
          <div className="text-foreground mb-2 text-sm font-medium">Next Steps:</div>
          <ul className="text-muted-foreground space-y-1.5 text-left text-sm">
            <li className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>Environment has been created</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>Quality gates have been configured</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                <ArrowRight className="text-primary-foreground h-3 w-3" />
              </div>
              <span>Deploy applications to this environment!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
