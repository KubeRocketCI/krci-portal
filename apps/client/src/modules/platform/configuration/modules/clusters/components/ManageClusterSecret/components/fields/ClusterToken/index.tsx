import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";

export const ClusterToken = () => {
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
      {...register(CLUSTER_FORM_NAMES.CLUSTER_TOKEN, {
        required: "Provide the cluster token.",
      })}
      label={"Cluster Token"}
      tooltipText={
        "Provide a Kubernetes  token with permissions to access the cluster. This token is required for proper authorization."
      }
      placeholder={"Enter cluster token"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
