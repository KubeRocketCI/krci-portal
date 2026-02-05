import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../names";
import { ApplicationFieldArrayItem } from "../../types";
import { useCreateCDPipelineFormContext } from "../../providers/form/hooks";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Check, Settings, Package, GitBranch, ArrowUpCircle } from "lucide-react";
import { cdPipelineDeploymentType } from "@my-project/shared";
import { InfoColumns } from "@/core/components/InfoColumns";
import { GridItem } from "@/core/components/InfoColumns/types";
import { useCodebaseBranchWatchItem } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";

const renderIconWithText = (
  icon: React.ComponentType<{ className?: string }> | null,
  text: string
): React.ReactNode => {
  const IconComponent = icon;

  return (
    <div className="flex items-center gap-1.5">
      {IconComponent && <IconComponent className="text-muted-foreground h-3.5 w-3.5" />}
      <span className="text-foreground text-sm">{text}</span>
    </div>
  );
};

interface ApplicationItemProps {
  appName: string;
  appBranch: string | undefined;
  appToPromote: boolean;
}

const ApplicationItem: React.FC<ApplicationItemProps> = ({ appName, appBranch, appToPromote }) => {
  const branchWatch = useCodebaseBranchWatchItem({
    name: appBranch,
  });
  const branchName = branchWatch.data?.spec?.branchName || appBranch || "Not set";

  return (
    <div className="bg-muted/50 border-border hover:bg-muted/70 flex items-center justify-between rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <Package className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">{appName}</span>
            {appToPromote && (
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary h-5 text-xs">
                <ArrowUpCircle className="mr-1 h-3 w-3" />
                Promote
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground text-xs">{branchName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Review: React.FC = () => {
  const form = useCreateCDPipelineFormContext();

  const name = useStore(form.store, (state) => state.values[NAMES.name]);
  const description = useStore(form.store, (state) => state.values[NAMES.description]);
  const deploymentType = useStore(form.store, (state) => state.values[NAMES.deploymentType]);
  const applications = useStore(form.store, (state) => state.values[NAMES.applications]);
  const ui_applicationsFieldArray = useStore(form.store, (state) => state.values[NAMES.ui_applicationsFieldArray]);

  const deploymentTypeLabel = React.useMemo(() => {
    if (deploymentType === cdPipelineDeploymentType.container) return "Container";
    if (deploymentType === cdPipelineDeploymentType.custom) return "Custom";
    return deploymentType || "Not set";
  }, [deploymentType]);

  // Step 2: PIPELINE_CONFIGURATION
  const pipelineConfigurationStepItems: GridItem[] = React.useMemo(() => {
    const items: GridItem[] = [];

    if (name) {
      items.push({
        label: "Pipeline Name",
        content: <span className="text-foreground text-sm">{name}</span>,
      });
    }

    if (description) {
      items.push({
        label: "Description",
        content: <span className="text-foreground text-sm">{description}</span>,
        colSpan: 2,
      });
    }

    if (deploymentType) {
      items.push({
        label: "Deployment Type",
        content: renderIconWithText(Settings, deploymentTypeLabel),
      });
    }

    return items;
  }, [name, description, deploymentType, deploymentTypeLabel]);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Step 1: APPLICATIONS */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Package className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Applications</h3>
            {applications && applications.length > 0 && (
              <Badge variant="outline" className="ml-auto">
                {applications.length} {applications.length === 1 ? "application" : "applications"}
              </Badge>
            )}
          </div>
          {applications && applications.length > 0 && ui_applicationsFieldArray ? (
            <div className="space-y-2">
              {applications.map((app: string) => {
                const appRow = ui_applicationsFieldArray.find((row: ApplicationFieldArrayItem) => row.appName === app);
                return (
                  <ApplicationItem
                    key={app}
                    appName={app}
                    appBranch={appRow?.appBranch}
                    appToPromote={appRow?.appToPromote || false}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">No applications selected</div>
          )}
        </Card>

        {/* Step 2: PIPELINE_CONFIGURATION */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Pipeline Configuration</h3>
          </div>
          <InfoColumns gridItems={pipelineConfigurationStepItems} gridCols={5} />
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5 p-5">
        <div className="flex gap-3">
          <Check className="text-primary mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h4 className="text-foreground mb-1 text-sm font-medium">Ready to Create</h4>
            <p className="text-muted-foreground text-sm">
              Your Deployment will be created with the configuration above. You'll be able to add environments and
              configure deployment stages.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
