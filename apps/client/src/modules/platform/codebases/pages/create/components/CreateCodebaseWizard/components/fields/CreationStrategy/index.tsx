import React from "react";
import { useStore } from "@tanstack/react-form";
import { codebaseCreationStrategy, codebaseType } from "@my-project/shared";
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

// Isolated component that subscribes to `type` so the parent AppField doesn't re-render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StrategyOptions: React.FC<{ field: any }> = ({ field }) => {
  const form = useCreateCodebaseForm();
  const type = useStore(form.store, (s) => s.values[NAMES.type]);
  const isAutotest = type === codebaseType.autotest;

  const options = React.useMemo(() => {
    return strategyOptions.map((opt) => ({
      ...opt,
      disabled: opt.value === codebaseCreationStrategy.create && isAutotest,
      disabledTooltip:
        opt.value === codebaseCreationStrategy.create && isAutotest
          ? "Create strategy is not available for autotests"
          : undefined,
    }));
  }, [isAutotest]);

  return (
    <field.FormRadioGroup
      label="Creation Strategy"
      options={options}
      variant="vertical"
      classNames={{ container: "grid-cols-3", item: "p-3", itemIcon: "h-4 w-4", itemIconContainer: "h-8 w-8" }}
    />
  );
};

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
      {(field) => <StrategyOptions field={field} />}
    </form.AppField>
  );
};
