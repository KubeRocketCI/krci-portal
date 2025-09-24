import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { CODEMIE_SECRET_FORM_NAMES } from "../../../../constants";

export const ClientSecret = () => {
  const {
    forms: { codemieSecret },
  } = useFormsContext();

  return (
    <FormTextFieldPassword
      {...codemieSecret.form.register(CODEMIE_SECRET_FORM_NAMES.CLIENT_SECRET)}
      label={"Client Secret"}
      tooltipText={"Enter the Client Secret for your CodeMie OAuth application."}
      placeholder={"Enter Client Secret"}
      control={codemieSecret.form.control}
      errors={codemieSecret.form.formState.errors}
    />
  );
};
