import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";
import { useDataContext } from "../../../../../providers/Data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const Name = () => {
  const form = useManageGitServerForm();
  const { gitServer } = useDataContext();
  const mode = gitServer ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <form.AppField name={NAMES.NAME}>
      {(field) => (
        <field.FormTextField
          label="Name"
          tooltipText="Enter the name of your Git Server (e.g., my-github)."
          placeholder="my-github"
          disabled={mode === FORM_MODES.EDIT}
        />
      )}
    </form.AppField>
  );
};
