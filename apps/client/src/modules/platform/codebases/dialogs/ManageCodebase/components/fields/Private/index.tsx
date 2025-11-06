import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const Private = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormSwitchRich
      {...register(CODEBASE_FORM_NAMES.private.name)}
      label="Private"
      helperText="Leave checked to create a private repository with restricted access (default). Uncheck for a public repository."
      control={control}
      errors={errors}
    />
  );
};
