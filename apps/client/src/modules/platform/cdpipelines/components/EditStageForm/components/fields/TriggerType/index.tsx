import React from "react";
import { Zap, Hand } from "lucide-react";
import { stageTriggerType } from "@my-project/shared";
import { useEditStageForm } from "../../../providers/form/hooks";

export const TriggerType: React.FC = () => {
  const form = useEditStageForm();

  const triggerTypeOptions = React.useMemo(
    () => [
      {
        label: stageTriggerType.Auto,
        value: stageTriggerType.Auto,
        description: "Automatically trigger deployment when changes are detected",
        icon: Zap,
      },
      {
        label: stageTriggerType.Manual,
        value: stageTriggerType.Manual,
        description: "Require manual approval before deployment",
        icon: Hand,
      },
      {
        label: stageTriggerType["Auto-stable"],
        value: stageTriggerType["Auto-stable"],
        description: "Automatically trigger deployment when changes are detected and the pipeline is stable",
        icon: Zap,
      },
    ],
    []
  );

  return (
    <form.AppField
      name="triggerType"
      validators={{
        onChange: ({ value }) => (!value ? "Select trigger type" : undefined),
      }}
    >
      {(field) => (
        <field.FormRadioGroup
          label="Trigger Type"
          tooltipText="Choose the trigger type for this stage, specifying whether it should be manually or automatically triggered after a successfully built pipeline."
          options={triggerTypeOptions}
          variant="horizontal"
          classNames={{ item: "p-3", itemIcon: "h-4 w-4", itemIconContainer: "h-8 w-8", container: "grid-cols-3" }}
        />
      )}
    </form.AppField>
  );
};
