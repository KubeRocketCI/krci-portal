import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";
import { updateGitUrlPath } from "../../../utils";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";
import { gitProvider } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";

export const GitRepoPath = () => {
  const form = useCreateGitOpsForm();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);
  const selectedGitServer = gitServers.find((gs) => gs.metadata.name === gitServerFieldValue);
  const isGerrit = selectedGitServer?.spec.gitProvider === gitProvider.gerrit;

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
      listeners={{
        onChange: ({ value }) => {
          const name = form.getFieldValue(CODEBASE_FORM_NAMES.NAME) || "";
          updateGitUrlPath(form, gitServerFieldValue, value, name, isGerrit);
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
