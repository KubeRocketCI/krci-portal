import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useEditGitOpsForm } from "../../../providers/form/hooks";

export const Name = () => {
  const form = useEditGitOpsForm();

  return (
    <form.AppField name={CODEBASE_FORM_NAMES.NAME}>
      {(field) => (
        <field.FormTextField
          label="Repository Name"
          tooltipText="Specify a unique repository name."
          prefix={<div className="bg-input/50 flex items-center px-5">/</div>}
        />
      )}
    </form.AppField>
  );
};
