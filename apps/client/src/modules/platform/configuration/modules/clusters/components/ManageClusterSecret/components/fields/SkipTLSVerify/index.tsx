import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
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
    <FormSwitchRich
      {...register(CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY)}
      label="Skip TLS verification"
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
    />
  );
};
