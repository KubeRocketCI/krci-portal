import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";

export const ClusterName = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useReactHookFormContext<ManageClusterSecretValues>();

  const {
    formData: { mode, ownerReference },
  } = useFormContext<ManageClusterSecretDataContext>();

  return (
    <FormTextField
      {...register(CLUSTER_FORM_NAMES.CLUSTER_NAME, {
        required: "Enter a name for the cluster.",
      })}
      label={"Cluster Name"}
      tooltipText={"Provide a unique and descriptive name for the new cluster."}
      placeholder={"Enter cluster name"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT || !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
