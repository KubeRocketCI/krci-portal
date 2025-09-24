import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_MODES } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useDataContext } from "../../../../providers/Data/hooks";

export const ApiUrl = () => {
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
    <FormTextField
      {...register(INTEGRATION_SECRET_FORM_NAMES.API_URL, {
        required: "Enter CodeMie API URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS),
          message: "Enter a valid URL with HTTP/HTTPS protocol.",
        },
      })}
      label={"API URL"}
      tooltipText={"Enter CodeMie API URL."}
      placeholder={"Enter URL"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
