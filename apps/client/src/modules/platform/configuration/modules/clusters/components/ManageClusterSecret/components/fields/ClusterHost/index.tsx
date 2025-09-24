import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_MODES } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const ClusterHost = () => {
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
      {...register(CLUSTER_FORM_NAMES.CLUSTER_HOST, {
        required: "Enter the cluster URL assigned to the host.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS),
          message: "Enter a valid URL with HTTPS protocol.",
        },
      })}
      label={"Cluster Host"}
      tooltipText={
        <>
          <p>
            Enter cluster’s endpoint URL (e.g., <em>https://example-cluster-domain.com)</em>.
          </p>
        </>
      }
      placeholder={"Enter cluster host"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
