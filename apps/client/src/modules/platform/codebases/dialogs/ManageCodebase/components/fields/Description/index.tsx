import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const Description = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);

  return (
    <FormTextField
      {...register(CODEBASE_FORM_NAMES.description.name, {
        required: `Enter ${typeFieldValue} description`,
      })}
      label={"Description"}
      tooltipText={"Add a brief description highlighting key features or functionality."}
      placeholder={`Enter ${typeFieldValue} description`}
      control={control}
      errors={errors}
    />
  );
};
