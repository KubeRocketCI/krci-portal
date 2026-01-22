import { useCodebaseBranchForm } from "../../../providers/form/hooks";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";

export const DefaultBranchVersion = () => {
  const form = useCodebaseBranchForm();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <form.AppField name={CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionStart.name as "defaultBranchVersionStart"}>
          {(field) => (
            <field.FormTextField
              label="Default branch version"
              tooltipText="Enter the necessary branch version for the artifact."
              placeholder="0.0.0"
            />
          )}
        </form.AppField>
      </div>
      <div className="mt-4">
        <form.AppField
          name={CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionPostfix.name as "defaultBranchVersionPostfix"}
        >
          {(field) => <field.FormTextField placeholder="SNAPSHOT" />}
        </form.AppField>
      </div>
    </div>
  );
};
