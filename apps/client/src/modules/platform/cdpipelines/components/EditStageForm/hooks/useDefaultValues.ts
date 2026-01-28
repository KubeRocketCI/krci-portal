import { Stage } from "@my-project/shared";
import React from "react";
import { EDIT_STAGE_FORM_NAMES } from "../constants";

export const useDefaultValues = (stage: Stage | undefined) => {
  return React.useMemo(
    () => ({
      [EDIT_STAGE_FORM_NAMES.triggerType]: stage?.spec.triggerType || "",
      [EDIT_STAGE_FORM_NAMES.triggerTemplate]: stage?.spec.triggerTemplate || "",
      [EDIT_STAGE_FORM_NAMES.cleanTemplate]: stage?.spec.cleanTemplate || "",
    }),
    [stage]
  );
};
