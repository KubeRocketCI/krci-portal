import React from "react";
import z from "zod";
import { Zap, Hand } from "lucide-react";
import { stageTriggerType } from "@my-project/shared";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const TriggerType = () => {
  const form = useCreateStageForm();

  const triggerTypeOptions = React.useMemo(
    () => [
      {
        label: stageTriggerType.Manual,
        value: stageTriggerType.Manual,
        description: "Require manual approval before deployment",
        icon: Hand,
      },
      {
        label: stageTriggerType.Auto,
        value: stageTriggerType.Auto,
        description: "Automatically trigger deployment when changes are detected",
        icon: Zap,
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
      name={NAMES.triggerType}
      validators={{
        onChange: z.string().min(1, "Select trigger type"),
      }}
      children={(field) => (
        <field.FormRadioGroup
          label="Trigger Type"
          options={triggerTypeOptions}
          variant="horizontal"
          classNames={{ item: "p-3", itemIcon: "h-4 w-4", itemIconContainer: "h-8 w-8", container: "grid-cols-3" }}
        />
      )}
    />
  );
};
