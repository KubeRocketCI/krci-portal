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
        required: "Enter the Dependency Track URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS),
          message: "Enter a valid URL with HTTP/HTTPS protocol.",
        },
      })}
      label={"URL"}
      tooltipText={"Enter the URL of your Dependency Track instance."}
      placeholder={"Enter URL"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
