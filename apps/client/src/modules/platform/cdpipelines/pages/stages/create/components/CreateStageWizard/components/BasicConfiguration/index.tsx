import React from "react";
import {
  ClusterField,
  StageNameField,
  NamespaceField,
  DescriptionField,
} from "@/modules/platform/cdpipelines/components/form-fields";
import { useCDPipelineData } from "../../hooks/useDefaultValues";

export const BasicConfiguration: React.FC = () => {
  const { cdPipeline, otherStages, namespace } = useCDPipelineData();

  const otherStagesNames = React.useMemo(() => otherStages.map((stage) => stage.spec.name), [otherStages]);

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
          <ClusterField />
        </div>
        <div>
          <StageNameField
            otherStagesNames={otherStagesNames}
            cdPipelineName={cdPipeline?.metadata.name}
            namespace={namespace}
          />
        </div>
        <div>
          <NamespaceField />
        </div>
        <div className="col-span-1 md:col-span-2">
          <DescriptionField />
        </div>
      </div>
    </div>
  );
};
