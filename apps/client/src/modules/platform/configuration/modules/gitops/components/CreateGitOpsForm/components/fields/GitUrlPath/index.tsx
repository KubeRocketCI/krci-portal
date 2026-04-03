import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";

export const GitUrlPath = () => {
  const form = useCreateGitOpsForm();

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.GIT_URL_PATH}
      validators={{
        onChange: ({ value }) => {
          if (!value || value.length < 3) {
            return "Repository path has to be at least 3 characters long.";
          }
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Git URL Path"
          tooltipText="Enter the Gerrit repository path."
          placeholder="Enter repository path"
        />
      )}
    </form.AppField>
  );
};
