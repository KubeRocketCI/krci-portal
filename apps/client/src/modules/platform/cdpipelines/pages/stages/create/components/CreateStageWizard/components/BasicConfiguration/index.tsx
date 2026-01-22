import React from "react";
import { useCDPipelineData } from "../../hooks/useDefaultValues";
import { useCreateStageForm } from "../../providers/form/hooks";
import { NAMES } from "../../names";
import z from "zod";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { inClusterName } from "@my-project/shared";

export const BasicConfiguration: React.FC = () => {
  const { cdPipeline, otherStages, namespace } = useCDPipelineData();
  const form = useCreateStageForm();
  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;

  const otherStagesNames = React.useMemo(() => otherStages.map((stage) => stage.spec.name), [otherStages]);

  const clusterOptions = React.useMemo(() => {
    const defaultClusterOption = { label: inClusterName, value: inClusterName };

    if (krciConfigMapWatch.isLoading || !krciConfigMap?.data?.available_clusters) {
      return [defaultClusterOption];
    }

    const availableClusters = krciConfigMap?.data?.available_clusters?.split(", ");
    const clusters = availableClusters.map((name: string) => ({ label: name, value: name }));

    return [defaultClusterOption, ...clusters];
  }, [krciConfigMapWatch.isLoading, krciConfigMap?.data?.available_clusters]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Basic Configuration</h2>
        <p className="text-muted-foreground text-sm">
          Configure the basic settings for your new environment including cluster, name, namespace, and description.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="col-span-1 md:col-span-2">
          <form.AppField
            name={NAMES.cluster}
            validators={{
              onChange: z.string().min(1, "Select cluster"),
            }}
            children={(field) => (
              <field.FormSelect label="Cluster" placeholder="Select cluster" options={clusterOptions} />
            )}
          />
        </div>
        <div>
          <form.AppField
            name={NAMES.name}
            validators={{
              onChange: ({ value }: { value: string }) => {
                if (!value) return "Environment name is required";
                if (value.length < 2) return "Environment name must be at least 2 characters long.";
                if (value.length > 10) return "Environment name must be not more than 10 characters long.";
                if (!/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/.test(value)) {
                  return "Environment name must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash.";
                }
                if (otherStagesNames.includes(value)) {
                  return `Environment "${value}" already exists in ${namespace} namespace.`;
                }
                return undefined;
              },
            }}
            listeners={{
              onChange: ({ value }: { value: string }) => {
                // Auto-generate namespace from stage name
                const currentNamespace = form.getFieldValue(NAMES.deployNamespace);
                if (value && cdPipeline?.metadata.name) {
                  const generatedNamespace = `${namespace}-${cdPipeline.metadata.name}-${value}`;
                  // Only update if user hasn't manually changed it
                  if (
                    !currentNamespace ||
                    currentNamespace === "" ||
                    currentNamespace.startsWith(`${namespace}-${cdPipeline.metadata.name}`)
                  ) {
                    form.setFieldValue(NAMES.deployNamespace, generatedNamespace);
                  }
                }
              },
            }}
            children={(field) => <field.FormTextField label="Environment Name" placeholder="e.g., dev, qa, prod" />}
          />
        </div>
        <div>
          <form.AppField
            name={NAMES.deployNamespace}
            validators={{
              onChange: ({ value }: { value: string }) => {
                if (!value) return "Namespace is required";
                if (value.length < 2) return "You must enter at least 2 characters";
                if (value.length > 63) return "You exceeded the maximum length of 63";
                if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
                  return "Namespace must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash.";
                }
                return undefined;
              },
            }}
            children={(field) => <field.FormTextField label="Deploy Namespace" placeholder="Enter deploy namespace" />}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <form.AppField
            name={NAMES.description}
            validators={{
              onChange: z.string().min(1, "Enter description"),
            }}
            children={(field) => <field.FormTextarea label="Description" placeholder="Enter environment description" />}
          />
        </div>
      </div>
    </div>
  );
};
