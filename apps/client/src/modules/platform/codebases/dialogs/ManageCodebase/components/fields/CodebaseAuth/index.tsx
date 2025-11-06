import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const CodebaseAuth = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormSwitchRich
      {...register(CODEBASE_FORM_NAMES.hasCodebaseAuth.name)}
      label="Repository credentials"
      control={control}
      errors={errors}
    />
  );
};
