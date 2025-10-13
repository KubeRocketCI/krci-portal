import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FROM_TEMPLATE_FORM_NAMES } from "../../../names";

export const Private = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormCheckbox
      {...register(CODEBASE_FROM_TEMPLATE_FORM_NAMES.PRIVATE)}
      label={
        <FormControlLabelWithTooltip
          label={"Private"}
          title="Leave checked to create a private repository with restricted access (default). Uncheck for a public repository."
        />
      }
      control={control}
      errors={errors}
    />
  );
};
