import React from "react";
import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";
import { updateGitUrlPath } from "../../../utils";
import { getGitServerStatusIcon, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";
import { gitProvider } from "@my-project/shared";

export const GitServer = () => {
  const form = useCreateGitOpsForm();

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
      listeners={{
        onChange: ({ value }) => {
          const gitRepoPath = form.getFieldValue(CODEBASE_FORM_NAMES.GIT_REPO_PATH) || "";
          const name = form.getFieldValue(CODEBASE_FORM_NAMES.NAME) || "";

          const selectedServer = gitServers.find((gs) => gs.metadata.name === value);
          const isGerrit = selectedServer?.spec.gitProvider === gitProvider.gerrit;

          updateGitUrlPath(form, value, gitRepoPath, name, isGerrit);
        },
      }}
    >
      {(field) => (
        <field.FormSelect label="Git server" tooltipText="Select an existing Git server" options={gitServersOptions} />
      )}
    </form.AppField>
  );
};
