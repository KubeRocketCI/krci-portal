import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { CODEMIE_FORM_NAMES } from "../../../../constants";

export const TokenEndpoint = () => {
  const {
    forms: { codemie },
  } = useFormsContext();

  return (
    <FormTextField
      {...codemie.form.register(CODEMIE_FORM_NAMES.TOKEN_ENDPOINT)}
      label={"Token Endpoint"}
      tooltipText={"Enter the OAuth token endpoint for your CodeMie instance."}
      placeholder={"Enter Token Endpoint"}
      control={codemie.form.control}
      errors={codemie.form.formState.errors}
    />
  );
};
