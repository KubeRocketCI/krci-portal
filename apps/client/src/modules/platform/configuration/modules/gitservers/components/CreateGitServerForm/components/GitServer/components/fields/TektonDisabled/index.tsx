import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const TektonDisabled = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.TEKTON_DISABLED}>
      {(field) => (
        <field.FormSwitch
          label="Disable Tekton Resources"
          helperText="When enabled, Tekton EventListener and Ingress/Route resources will not be created for this Git Server."
          rich
        />
      )}
    </form.AppField>
  );
};
