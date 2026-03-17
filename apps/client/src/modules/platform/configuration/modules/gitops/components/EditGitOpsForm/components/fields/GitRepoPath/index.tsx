import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useEditGitOpsForm } from "../../../providers/form/hooks";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";

export const GitRepoPath = () => {
  const form = useEditGitOpsForm();

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.GIT_REPO_PATH}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter relative path to repository.";
          const validationResult = validateField(value, validationRules.GIT_URL_PATH);
          if (validationResult !== true) return validationResult;
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Git repo relative path"
          tooltipText="Enter your account name where the repository will be stored."
          placeholder="Indicate the repository relative path in the following format project/repository"
          prefix={<div className="bg-input/50 flex items-center px-5">/</div>}
        />
      )}
    </form.AppField>
  );
};
