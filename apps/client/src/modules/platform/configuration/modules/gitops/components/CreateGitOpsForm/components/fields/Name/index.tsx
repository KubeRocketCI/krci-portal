import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";
import { updateGitUrlPath } from "../../../utils";
import { gitProvider } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";

export const Name = () => {
  const form = useCreateGitOpsForm();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);
  const selectedGitServer = gitServers.find((gs) => gs.metadata.name === gitServerFieldValue);
  const isGerrit = selectedGitServer?.spec.gitProvider === gitProvider.gerrit;

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.NAME}
      listeners={{
        onChange: ({ value }) => {
          const gitRepoPath = form.getFieldValue(CODEBASE_FORM_NAMES.GIT_REPO_PATH) || "";
          updateGitUrlPath(form, gitServerFieldValue, gitRepoPath, value, isGerrit);
        },
      }}
    >
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
