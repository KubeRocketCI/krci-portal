import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { QUICK_LINK_FORM_NAMES } from "../../../names";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";

export const Visible = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormCheckbox
      {...register(QUICK_LINK_FORM_NAMES.visible.name)}
      label={
        <FormControlLabelWithTooltip
          label={"Show on Overview Page"}
          title="Display this component in the Overview page for quick access."
        />
      }
      control={control}
      errors={errors}
    />
  );
};
