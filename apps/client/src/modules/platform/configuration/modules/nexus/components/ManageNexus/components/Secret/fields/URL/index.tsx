import { FormTextFieldEditable } from "@/core/providers/Form/components/FormTextFieldEditable";
import { FORM_MODES } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useFormsContext } from "../../../../hooks/useFormsContext";
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
        required: "Enter the Nexus repository URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS),
          message: "Enter a valid URL with HTTP/HTTPS protocol.",
        },
      })}
      label={`URL`}
      title={
        <>
          <p>
            Enter the Nexus repository URL depending service type. Ensure it includes the correct protocol and endpoint:
          </p>
          <p>
            Internal service example: <em>http://nexus.nexus-namespace:8081</em>
          </p>
          <p>
            External service example: <em>https://nexus.example.com</em>
          </p>
        </>
      }
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
