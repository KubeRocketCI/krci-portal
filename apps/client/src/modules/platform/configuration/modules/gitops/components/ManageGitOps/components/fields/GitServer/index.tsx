import React from "react";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { useGitOpsForm } from "../../../providers/form/hooks";
import { useGitOpsData } from "../../../providers/data/hooks";
import { updateGitUrlPath } from "../../../utils";
import { getGitServerStatusIcon, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";
import { gitProvider } from "@my-project/shared";

export const GitServer = () => {
  const form = useGitOpsForm();
  const { isReadOnly } = useGitOpsData();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const gitServersOptions = React.useMemo(
    () =>
      gitServers
        ? gitServers.map((gitServer) => {
            const statusIcon = getGitServerStatusIcon(gitServer);

            return {
              label: gitServer.metadata.name,
              value: gitServer.metadata.name,
              disabled: !gitServer.status?.connected,
              icon: (
                <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />
              ),
            };
          })
        : [],
    [gitServers]
  );

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.GIT_SERVER}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Select an existing Git server";
          return undefined;
        },
      }}
      // Use listeners.onChange to update gitUrlPath when git server changes
      // This replaces the RHF pattern of watch + setValue
      listeners={{
        onChange: ({ value }) => {
          // Get current values from store
          const gitRepoPath = form.getFieldValue(CODEBASE_FORM_NAMES.GIT_REPO_PATH) || "";
          const name = form.getFieldValue(CODEBASE_FORM_NAMES.NAME) || "";

          // Determine if new server is Gerrit
          const selectedServer = gitServers.find((gs) => gs.metadata.name === value);
          const isGerrit = selectedServer?.spec.gitProvider === gitProvider.gerrit;

          updateGitUrlPath(form, value, gitRepoPath, name, isGerrit);
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Git server"
          tooltipText="Select an existing Git server"
          options={gitServersOptions}
          disabled={isReadOnly}
        />
      )}
    </form.AppField>
  );
};
