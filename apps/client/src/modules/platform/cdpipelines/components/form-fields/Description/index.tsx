import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/stages/create/components/CreateStageWizard/names";

export const DescriptionField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextField
      {...register(NAMES.description, {
        required: `Enter description.`,
      })}
      label={"Description"}
      tooltipText={"Provide a brief description of the environment to convey its purpose and characteristics."}
      placeholder={"Enter description"}
      control={control}
      errors={errors}
    />
  );
};
