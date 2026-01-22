import { CODEBASE_FORM_NAMES } from "../../../names";
import { useGitOpsForm } from "../../../providers/form/hooks";
import { useGitOpsData } from "../../../providers/data/hooks";
import { updateGitUrlPath } from "../../../utils";
import { gitProvider } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";

export const Name = () => {
  const form = useGitOpsForm();
  const { isReadOnly } = useGitOpsData();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  // Subscribe to dependent field values for determining isGerrit
  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);
  const selectedGitServer = gitServers.find((gs) => gs.metadata.name === gitServerFieldValue);
  const isGerrit = selectedGitServer?.spec.gitProvider === gitProvider.gerrit;

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.NAME}
      // Use listeners.onChange to update gitUrlPath when this field changes
      // This replaces the RHF pattern of watch + setValue in useEffect
      listeners={{
        onChange: ({ value }) => {
          // Get current values from store
          const gitRepoPath = form.getFieldValue(CODEBASE_FORM_NAMES.GIT_REPO_PATH) || "";
          updateGitUrlPath(form, gitServerFieldValue, gitRepoPath, value, isGerrit);
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Repository Name"
          tooltipText="Specify a unique repository name."
          prefix={<div className="flex items-center px-5">/</div>}
          disabled={isReadOnly}
        />
      )}
    </form.AppField>
  );
};
