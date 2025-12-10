import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { useFormContext } from "react-hook-form";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { stageTriggerType } from "@my-project/shared";
import { NAMES } from "../../../pages/stages/create/components/CreateStageWizard/names";

const triggerTypeSelectOptions = mapArrayToSelectOptions(Object.values(stageTriggerType));

export const TriggerTypeField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSelect
      {...register(NAMES.triggerType, {
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
