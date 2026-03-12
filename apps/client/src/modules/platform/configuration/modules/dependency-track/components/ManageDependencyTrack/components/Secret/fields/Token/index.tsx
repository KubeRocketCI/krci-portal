import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageDependencyTrackForm } from "../../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const Token = () => {
  const form = useManageDependencyTrackForm();
  const { ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an API token for authentication with Dependency Track. Generate the token from your Dependency Track instance."
          placeholder="Enter token"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
