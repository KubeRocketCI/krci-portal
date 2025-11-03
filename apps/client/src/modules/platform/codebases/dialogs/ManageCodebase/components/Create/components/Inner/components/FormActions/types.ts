import React from "react";
import { ManageCodebaseFormValues } from "../../../../../../types";
import { ValueOf } from "@my-project/shared";
import { mainTabs } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";

export interface FormActionsProps {
  baseDefaultValues: Partial<ManageCodebaseFormValues>;
  setActiveTab: React.Dispatch<React.SetStateAction<ValueOf<typeof mainTabs>>>;
}
