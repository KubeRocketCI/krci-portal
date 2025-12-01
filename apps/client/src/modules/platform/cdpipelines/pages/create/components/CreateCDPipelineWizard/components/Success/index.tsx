import React from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/core/components/ui/button";
import { PartyPopper, Check, ArrowRight, FolderOpen, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { NAMES, CreateCDPipelineFormValues } from "../../names";
import { routeCDPipelineList } from "../../../../../list/route";
import { routeCDPipelineDetails } from "../../../../../details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useWizardStore } from "../../store";

export const Success: React.FC = () => {
  const { watch } = useFormContext<CreateCDPipelineFormValues>();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const name = watch(NAMES.name);

  const handleCreateAnother = () => {
    useWizardStore.getState().reset();
    // Reload the page to reset the form
    window.location.href = `/c/${clusterName}/cdpipelines/create`;
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 text-center">
        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
          <PartyPopper className="text-primary h-10 w-10" />
        </div>

        <div>
          <h1 className="text-foreground mb-2 text-xl font-semibold">Deployment Flow Created Successfully!</h1>
          <p className="text-muted-foreground text-sm">
            Your Deployment Flow <span className="text-foreground font-medium">{name || "pipeline"}</span> has been
            created and is ready to use
          </p>
        </div>

        <div className="border-border w-full border-t pt-4">
          <h3 className="text-foreground mb-4 text-base font-semibold">What would you like to do next?</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link to={routeCDPipelineList.fullPath} params={{ clusterName }}>
                <FolderOpen className="text-muted-foreground h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">View All Deployment Flows</span>
                  <span className="text-muted-foreground text-[10px]">Go back to deployment flows list</span>
                </div>
              </Link>
            </Button>

            <Button size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link
                to={routeCDPipelineDetails.fullPath}
                params={{
                  clusterName,
                  name: name || "",
                  namespace: defaultNamespace || "",
                }}
              >
                <ExternalLink className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">Open Deployment Flow</span>
                  <span className="text-[10px] opacity-80">View deployment flow details</span>
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
                <span className="text-xs">Create Another Deployment Flow</span>
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
              <span>Deployment Flow has been created</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>Applications have been configured</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                <ArrowRight className="text-primary-foreground h-3 w-3" />
              </div>
              <span>Add environments and configure deployment stages!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

