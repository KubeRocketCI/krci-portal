import React from "react";
import {
  TriggerTypeField,
  DeployTemplateField,
  CleanTemplateField,
} from "@/modules/platform/cdpipelines/components/form-fields";

export const FormContent: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <TriggerTypeField />
      </div>
      <div />
      <div>
        <DeployTemplateField />
      </div>
      <div>
        <CleanTemplateField />
      </div>
    </div>
  );
};
