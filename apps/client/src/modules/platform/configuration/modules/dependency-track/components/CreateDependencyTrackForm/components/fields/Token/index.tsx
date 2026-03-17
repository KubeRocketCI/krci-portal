import { NAMES } from "../../../constants";
import { useCreateDependencyTrackForm } from "../../../providers/form/hooks";

export const Token = () => {
  const form = useCreateDependencyTrackForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an API token for authentication with Dependency-Track. Generate the token from your Dependency-Track instance and paste it here."
          placeholder="Enter token"
        />
      )}
    </form.AppField>
  );
};
