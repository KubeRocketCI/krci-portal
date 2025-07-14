import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../names";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { stageTriggerType } from "@my-project/shared";

const triggerTypeSelectOptions = mapArrayToSelectOptions(Object.values(stageTriggerType));

export const TriggerType = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormSelect
      {...register(STAGE_FORM_NAMES.triggerType.name, {
        required: "Select trigger type",
      })}
      label={"Trigger type"}
      tooltipText={
        "Choose the trigger type for this stage, specifying whether it should be manually or automatically triggered after a successfully  built pipeline."
      }
      control={control}
      errors={errors}
      options={triggerTypeSelectOptions}
    />
  );
};
