import { DialogTitle } from "@/core/components/ui/dialog";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useTypedFormContext } from "@/modules/platform/codebases/dialogs/ManageCodebase/hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "@/modules/platform/codebases/dialogs/ManageCodebase/names";
import { codebaseType } from "@my-project/shared";
import React from "react";

export const DialogHeader = () => {
  const { watch } = useTypedFormContext();

  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name) as string;
  const capitalizedType = capitalizeFirstLetter(typeFieldValue);
  const docLink = React.useMemo(() => {
    switch (typeFieldValue) {
      case codebaseType.application:
        return EDP_USER_GUIDE.APPLICATION_CREATE.url;
      case codebaseType.autotest:
        return EDP_USER_GUIDE.AUTOTEST_CREATE.url;
      case codebaseType.library:
        return EDP_USER_GUIDE.LIBRARY_CREATE.url;
      case codebaseType.infrastructure:
        return EDP_USER_GUIDE.INFRASTRUCTURE_CREATE.url;
      default:
        return EDP_USER_GUIDE.APPLICATION_CREATE.url;
    }
  }, [typeFieldValue]);

  return (
    <div className="flex items-start justify-between gap-1">
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-xl font-medium">{`Create ${capitalizedType}`}</DialogTitle>
        <LearnMoreLink url={docLink} />
      </div>
    </div>
  );
};
