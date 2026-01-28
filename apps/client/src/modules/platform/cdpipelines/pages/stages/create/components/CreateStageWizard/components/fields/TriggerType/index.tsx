import React from "react";
import z from "zod";
import { stageTriggerType } from "@my-project/shared";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const TriggerType = () => {
  const form = useCreateStageForm();

  const triggerTypeOptions = React.useMemo(
    () => [
      {
        label: stageTriggerType.Auto,
        value: stageTriggerType.Auto,
        description: "Automatically trigger deployment when changes are detected",
      },
      {
        label: stageTriggerType.Manual,
        value: stageTriggerType.Manual,
        description: "Require manual approval before deployment",
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
          variant="tile"
          classNames={{ container: "grid-cols-2" }}
        />
      )}
    />
  );
};
