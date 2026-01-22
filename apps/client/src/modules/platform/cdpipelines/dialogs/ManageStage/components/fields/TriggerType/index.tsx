import { STAGE_FORM_NAMES } from "../../../names";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { stageTriggerType } from "@my-project/shared";
import { useStageForm } from "../../../providers/form/hooks";

const triggerTypeSelectOptions = mapArrayToSelectOptions(Object.values(stageTriggerType));

export const TriggerType = () => {
  const form = useStageForm();

  return (
    <form.AppField
      name={STAGE_FORM_NAMES.triggerType.name}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Select trigger type";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Trigger type"
          tooltipText="Choose the trigger type for this stage, specifying whether it should be manually or automatically triggered after a successfully built pipeline."
          options={triggerTypeSelectOptions}
        />
      )}
    </form.AppField>
  );
};
