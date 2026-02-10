import React from "react";
import { useStore } from "@tanstack/react-form";
import { codebaseCreationStrategy } from "@my-project/shared";
import { FileCode, CopyPlus, CloudDownload } from "lucide-react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const strategyOptions = [
  {
    value: codebaseCreationStrategy.create,
    label: "Create",
    description: "Create an empty project and configure everything manually for maximum flexibility",
    icon: FileCode,
  },
  {
    value: codebaseCreationStrategy.clone,
    label: "Clone",
    description: "Clone code from third-party VCS providers",
    icon: CopyPlus,
  },
  {
    value: codebaseCreationStrategy.import,
    label: "Import",
    description: "Onboard your existing code to the KubeRocketCI platform",
    icon: CloudDownload,
  },
];

export const CreationStrategy: React.FC = () => {
  const form = useCreateCodebaseForm();
  const creationMethod = useStore(form.store, (s) => s.values[NAMES.ui_creationMethod]);

  return (
    <form.AppField
      name={NAMES.strategy}
      validators={{
        onChange: ({ value }) => {
          const method = form.store.state.values[NAMES.ui_creationMethod];
          return method === "custom" && !value ? "Select creation strategy" : undefined;
        },
      }}
      listeners={{
        onChange: () => {
          if (creationMethod === "custom") {
            form.setFieldValue(NAMES.repositoryUrl, "");
          }
        },
      }}
    >
      {(field) => (
        <field.FormRadioGroup
          label="Creation Strategy"
          options={strategyOptions}
          variant="vertical"
          classNames={{ container: "grid-cols-3", item: "p-3", itemIcon: "h-6 w-6", itemIconContainer: "h-8 w-8" }}
        />
      )}
    </form.AppField>
  );
};
