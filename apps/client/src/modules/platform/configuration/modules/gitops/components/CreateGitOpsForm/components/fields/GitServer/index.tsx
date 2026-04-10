import React from "react";
import { gitProvider } from "@my-project/shared";
import { CODEBASE_FORM_NAMES, GIT_OPS_CODEBASE_NAME } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";
import { getGitServerStatusIcon, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";

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
          const selectedServer = gitServers.find((gs) => gs.metadata.name === value);
          const provider = selectedServer?.spec.gitProvider ?? "";
          const isGerrit = provider === gitProvider.gerrit;

          form.setFieldValue(CODEBASE_FORM_NAMES.UI_GIT_SERVER_PROVIDER, provider);
          form.setFieldValue(CODEBASE_FORM_NAMES.UI_REPOSITORY_OWNER, "");

          if (isGerrit) {
            form.setFieldValue(CODEBASE_FORM_NAMES.UI_REPOSITORY_NAME, "");
            form.setFieldValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, `/${GIT_OPS_CODEBASE_NAME}`);
          } else {
            form.setFieldValue(CODEBASE_FORM_NAMES.UI_REPOSITORY_NAME, GIT_OPS_CODEBASE_NAME);
            form.setFieldValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, "");
          }
        },
      }}
    >
      {(field) => (
        <field.FormSelect label="Git server" tooltipText="Select an existing Git server" options={gitServersOptions} />
      )}
    </form.AppField>
  );
};
