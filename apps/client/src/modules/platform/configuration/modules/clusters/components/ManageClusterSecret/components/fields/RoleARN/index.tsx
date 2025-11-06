import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";

export const RoleARN = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useReactHookFormContext<ManageClusterSecretValues>();

  const {
    formData: { mode, ownerReference },
  } = useFormContext<ManageClusterSecretDataContext>();

  return (
    <FormTextFieldPassword
      {...register(CLUSTER_FORM_NAMES.ROLE_ARN, {
        required: "Enter Role ARN.",
      })}
      label={"Role ARN"}
      placeholder={"Enter Role ARN."}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
