import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { FORM_MODES } from "@/core/types/forms";

export const SkipTLSVerify = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useReactHookFormContext();

  const {
    formData: { mode, ownerReference },
  } = useFormContext<ManageClusterSecretDataContext>();

  return (
    <FormCheckbox
      {...register(CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY)}
      label={
        <FormControlLabelWithTooltip
          label={"Skip TLS verification"}
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
        />
      }
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
    />
  );
};
