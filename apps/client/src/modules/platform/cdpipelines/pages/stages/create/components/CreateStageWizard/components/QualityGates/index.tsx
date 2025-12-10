import React from "react";
import { QualityGatesField } from "@/modules/platform/cdpipelines/components/form-fields";
import { useCDPipelineData } from "../../hooks/useDefaultValues";

export const QualityGates: React.FC = () => {
  const { namespace } = useCDPipelineData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Quality Gates</h2>
        <p className="text-muted-foreground text-sm">
          Define quality gates that must pass before applications can be promoted to the next environment. You can
          configure manual approvals or automated tests.
        </p>
      </div>

      <QualityGatesField namespace={namespace} />
    </div>
  );
};
