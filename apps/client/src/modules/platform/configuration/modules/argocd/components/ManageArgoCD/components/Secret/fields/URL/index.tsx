import { FormTextFieldEditable } from "@/core/providers/Form/components/FormTextFieldEditable";
import { FORM_MODES } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useDataContext } from "../../../../providers/Data/hooks";

export const URL = () => {
  const {
    forms: {
      secret: {
        form: {
          register,
          control,
          formState: { errors },
        },
      },
    },
  } = useFormsContext();

  const { mode, ownerReference } = useDataContext();

  return (
    <FormTextFieldEditable
      {...register(INTEGRATION_SECRET_FORM_NAMES.URL, {
        required: "Enter the Argo CD URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS),
          message: "Enter a valid URL with HTTPS protocol.",
        },
      })}
      label={"URL"}
      tooltipText={
        <>
          <p>
            Enter the URL of your Argo CD instance. Ensure to use the HTTPS protocol (e.g.,
            <em>https://argocd.example.com</em>).
          </p>
        </>
      }
      placeholder={"Enter URL"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
