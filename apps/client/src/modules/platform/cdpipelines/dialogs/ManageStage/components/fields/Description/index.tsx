import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../names";

export const Description = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormTextField
      {...register(STAGE_FORM_NAMES.description.name, {
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
