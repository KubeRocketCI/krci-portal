import React from "react";
import { TriggerType, DeployTemplate, CleanTemplate } from "./fields";
import { QualityGatesFieldInline } from "./QualityGatesFieldInline";

export const FormContent: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <TriggerType />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DeployTemplate />
          <CleanTemplate />
        </div>
      </div>
      <div>
        <QualityGatesFieldInline />
      </div>
    </div>
  );
};
