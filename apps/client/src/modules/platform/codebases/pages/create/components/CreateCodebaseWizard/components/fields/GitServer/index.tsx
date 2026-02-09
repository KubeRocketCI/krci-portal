import React from "react";
import { useGitServerWatchList, getGitServerStatusIcon } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const GitServer: React.FC = () => {
  const form = useCreateCodebaseForm();
  const gitServersWatch = useGitServerWatchList();

  console.log("🔍 [GitServer] useGitServerWatchList result:", gitServersWatch);
  console.log("🔍 [GitServer] data:", gitServersWatch.data);
  console.log("🔍 [GitServer] data.array:", gitServersWatch.data.array);
  console.log("🔍 [GitServer] isLoading:", gitServersWatch.isLoading);
  console.log("🔍 [GitServer] isEmpty:", gitServersWatch.isEmpty);

  const gitServers = gitServersWatch.data.array;

  const options = React.useMemo(
    () =>
      gitServers.map((gitServer) => {
        const statusIcon = getGitServerStatusIcon(gitServer);
        return {
          label: gitServer.metadata.name,
          value: gitServer.metadata.name,
          disabled: !gitServer.status?.connected,
          icon: <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />,
        };
      }),
    [gitServers]
  );

  return (
    <form.AppField
      name={NAMES.gitServer}
      validators={{
        onChange: ({ value }) => (!value ? "Select an existing Git server" : undefined),
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Git server"
          tooltipText="Choose the Git server for hosting your repository."
          options={options}
        />
      )}
    </form.AppField>
  );
};
