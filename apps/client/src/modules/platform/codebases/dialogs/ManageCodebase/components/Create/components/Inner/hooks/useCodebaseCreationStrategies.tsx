import React from "react";
import { useTypedFormContext } from "../../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../../names";
import { codebaseType } from "@my-project/shared";
import { CloudDownload, CopyPlus, FolderPlus } from "lucide-react";

export const useCodebaseCreationStrategies = () => {
  const { watch } = useTypedFormContext();
  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);

  return React.useMemo(
    () => [
      ...(typeFieldValue !== codebaseType.autotest
        ? [
            {
              value: "create",
              label: "Create from template",
              description: "Create a sample project from a template to start quickly.",
              icon: <FolderPlus size={24} color="#002446" />,
              checkedIcon: <FolderPlus size={24} color="#002446" />,
              disabled: !typeFieldValue || typeFieldValue === codebaseType.autotest,
            },
          ]
        : []),
      {
        value: "clone",
        label: "Clone project",
        description: "Clone code from third-party VCS providers.",
        icon: <CopyPlus size={24} color="#002446" />,
        checkedIcon: <CopyPlus size={24} color="#002446" />,
        disabled: !typeFieldValue,
      },
      {
        value: "import",
        label: "Import project",
        description: "Onboard your existing code to the KubeRocketCI platform.",
        icon: <CloudDownload size={24} color="#002446" />,
        checkedIcon: <CloudDownload size={24} color="#002446" />,
        disabled: !typeFieldValue,
      },
    ],
    [typeFieldValue]
  );
};
