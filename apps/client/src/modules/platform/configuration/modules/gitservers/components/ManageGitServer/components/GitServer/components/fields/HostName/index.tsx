import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../../../../names";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const HostName = () => {
  const {
    forms: { gitServer: gitServerForm },
  } = useFormsContext();

  return (
    <FormTextField
      {...gitServerForm.form.register(GIT_SERVER_FORM_NAMES.GIT_HOST, {
        required: "Enter the Git server hostname or IP address. ",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.NO_PROTOCOL),
          message: "Enter a valid URL without protocol.",
        },
      })}
      label={"Host"}
      tooltipText={"Enter the hostname or IP address of your Git Server (e.g.,  github.com)."}
      placeholder={"host-name.com"}
      control={gitServerForm.form.control}
      errors={gitServerForm.form.formState.errors}
    />
  );
};
