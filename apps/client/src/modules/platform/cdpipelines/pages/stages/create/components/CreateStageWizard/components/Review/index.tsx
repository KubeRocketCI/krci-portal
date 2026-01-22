import React from "react";
import { NAMES } from "../../names";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Check, Settings, Server, Shield, Workflow, Globe } from "lucide-react";
import { InfoColumns } from "@/core/components/InfoColumns";
import { GridItem } from "@/core/components/InfoColumns/types";
import { useCreateStageForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

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

export const Review: React.FC = () => {
  const form = useCreateStageForm();

  // Subscribe to form values
  const name = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.name]);
  const description = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.description]);
  const cluster = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.cluster]);
  const deployNamespace = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.deployNamespace]);
  const triggerType = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.triggerType]);
  const triggerTemplate = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.triggerTemplate]);
  const cleanTemplate = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.cleanTemplate]);
  const qualityGates = useStore(form.store, (state: typeof form.store.state) => state.values[NAMES.qualityGates]);

  // Basic Configuration Items
  const basicConfigurationItems: GridItem[] = React.useMemo(() => {
    const items: GridItem[] = [];

    if (name) {
      items.push({
        label: "Environment Name",
        content: <span className="text-foreground text-sm">{name}</span>,
      });
    }

    if (cluster) {
      items.push({
        label: "Cluster",
        content: renderIconWithText(Server, cluster),
      });
    }

    if (deployNamespace) {
      items.push({
        label: "Namespace",
        content: renderIconWithText(Globe, deployNamespace),
      });
    }

    if (description) {
      items.push({
        label: "Description",
        content: <span className="text-foreground text-sm">{description}</span>,
        colSpan: 2,
      });
    }

    return items;
  }, [name, cluster, deployNamespace, description]);

  // Pipeline Configuration Items
  const pipelineConfigurationItems: GridItem[] = React.useMemo(() => {
    const items: GridItem[] = [];

    if (triggerType) {
      items.push({
        label: "Trigger Type",
        content: <span className="text-foreground text-sm capitalize">{triggerType}</span>,
      });
    }

    if (triggerTemplate) {
      items.push({
        label: "Deploy Pipeline Template",
        content: renderIconWithText(Workflow, triggerTemplate),
      });
    }

    if (cleanTemplate) {
      items.push({
        label: "Clean Pipeline Template",
        content: renderIconWithText(Workflow, cleanTemplate),
      });
    }

    return items;
  }, [triggerType, triggerTemplate, cleanTemplate]);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Basic Configuration */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Basic Configuration</h3>
          </div>
          <InfoColumns gridItems={basicConfigurationItems} gridCols={5} />
        </Card>

        {/* Pipeline Configuration */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Workflow className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Pipeline Configuration</h3>
          </div>
          <InfoColumns gridItems={pipelineConfigurationItems} gridCols={5} />
        </Card>

        {/* Quality Gates */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-xl font-semibold">Quality Gates</h3>
            {qualityGates && qualityGates.length > 0 && (
              <Badge variant="outline" className="ml-auto">
                {qualityGates.length} {qualityGates.length === 1 ? "gate" : "gates"}
              </Badge>
            )}
          </div>
          {qualityGates && qualityGates.length > 0 ? (
            <div className="space-y-2">
              {qualityGates.map((gate: (typeof qualityGates)[0], index: number) => (
                <div
                  key={gate.id || index}
                  className="bg-muted/50 border-border hover:bg-muted/70 flex items-center justify-between rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-medium capitalize">{gate.qualityGateType}</span>
                        {gate.stepName && (
                          <Badge variant="outline" className="h-5 text-xs">
                            {gate.stepName}
                          </Badge>
                        )}
                      </div>
                      {gate.autotestName && (
                        <span className="text-muted-foreground text-xs">
                          Autotest: {gate.autotestName}
                          {gate.branchName && ` (${gate.branchName})`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">No quality gates configured</div>
          )}
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5 p-5">
        <div className="flex gap-3">
          <Check className="text-primary mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h4 className="text-foreground mb-1 text-sm font-medium">Ready to Create</h4>
            <p className="text-muted-foreground text-sm">
              Your Environment will be created with the configuration above. You'll be able to deploy applications and
              run pipelines once the environment is ready.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
