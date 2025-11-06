import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { QUICK_LINK_FORM_NAMES } from "../../../names";

export const Visible = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormSwitchRich
      {...register(QUICK_LINK_FORM_NAMES.visible.name)}
      label="Show on Overview Page"
      helperText="Display this component in the Overview page for quick access."
      control={control}
      errors={errors}
    />
  );
};
