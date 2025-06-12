import { useTypedFormContext } from "@/modules/platform/codebases/dialogs/ManageCodebase/hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "@/modules/platform/codebases/dialogs/ManageCodebase/names";
import React from "react";

export const useUpdateJiraServerIntegrationValue = () => {
  const { watch, setValue } = useTypedFormContext();

  const jiraServerFieldValue = watch(CODEBASE_FORM_NAMES.jiraServer.name);

  React.useEffect(() => {
    if (!jiraServerFieldValue) {
      return;
    }

    setValue(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name, true, { shouldDirty: false });
  }, [jiraServerFieldValue, setValue]);
};
