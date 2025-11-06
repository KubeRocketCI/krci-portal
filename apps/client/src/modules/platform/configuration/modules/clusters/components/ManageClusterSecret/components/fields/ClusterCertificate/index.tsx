import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_MODES } from "@/core/types/forms";

export const ClusterCertificate = () => {
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
      {...register(CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE, {
        required: "Paste the cluster certificate.",
      })}
      label={"Cluster Certificate"}
      tooltipText={
        "Provide a Kubernetes  certificate required for proper authentication. Take this certificate from the config file of the user you are going to access the cluster."
      }
      placeholder={"Enter cluster certificate"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
