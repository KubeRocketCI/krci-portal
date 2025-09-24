import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../types";
import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";
import { useFormContext } from "@/core/providers/Form/hooks";

export const CaData = () => {
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
      {...register(CLUSTER_FORM_NAMES.CA_DATA, {
        required: "Enter Certificate Authority Data.",
      })}
      label={"Certificate Authority Data"}
      placeholder={"Enter Certificate Authority Data."}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
