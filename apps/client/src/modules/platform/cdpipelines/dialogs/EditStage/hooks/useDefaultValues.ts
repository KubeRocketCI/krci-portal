import { Stage } from "@my-project/shared";
import React from "react";
import { NAMES } from "../../../pages/stages/create/components/CreateStageWizard/names";

export const useDefaultValues = (stage: Stage | undefined) => {
  return React.useMemo(
    () => ({
      [NAMES.triggerType]: stage?.spec.triggerType || "",
      [NAMES.triggerTemplate]: stage?.spec.triggerTemplate || "",
      [NAMES.cleanTemplate]: stage?.spec.cleanTemplate || "",
    }),
    [stage]
  );
};
