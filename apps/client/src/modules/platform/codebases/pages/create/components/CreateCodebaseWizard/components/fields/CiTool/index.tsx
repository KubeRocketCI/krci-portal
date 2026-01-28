import React from "react";
import { ciTool } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const CiToolField: React.FC = () => {
  const form = useCreateCodebaseForm();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;
  const selectedGitServer = gitServers.find((gs) => gs.metadata.name === gitServerFieldValue);
  const isGitlabProvider = selectedGitServer?.spec.gitProvider === "gitlab";

  const options = React.useMemo(
    () => [
      { label: "Tekton", value: ciTool.tekton },
      ...(isGitlabProvider ? [{ label: "GitLab CI", value: ciTool.gitlab }] : []),
    ],
    [isGitlabProvider]
  );

  return (
    <form.AppField name={NAMES.ciTool}>
      {(field) => <field.FormSelect label="CI Pipelines" options={options} disabled={!isGitlabProvider} />}
    </form.AppField>
  );
};
