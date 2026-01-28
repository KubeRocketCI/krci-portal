import React from "react";
import { TriggerType, DeployTemplate, CleanTemplate } from "../fields";

export const PipelineConfiguration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Pipeline Configuration</h2>
        <p className="text-muted-foreground text-sm">
          Configure the pipeline settings including trigger type and pipeline templates for deployment and cleanup.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <TriggerType />
        </div>
        <div />
        <div>
          <DeployTemplate />
        </div>
        <div>
          <CleanTemplate />
        </div>
      </div>
    </div>
  );
};
