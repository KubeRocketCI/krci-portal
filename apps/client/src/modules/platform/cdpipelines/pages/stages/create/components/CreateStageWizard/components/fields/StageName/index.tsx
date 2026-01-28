import React from "react";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { useCDPipelineData } from "../../../hooks/useDefaultValues";

export const StageName = () => {
  const form = useCreateStageForm();
  const { cdPipeline, otherStages, namespace } = useCDPipelineData();

  const otherStagesNames = React.useMemo(() => otherStages.map((stage) => stage.spec.name), [otherStages]);

  return (
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
  );
};
