import React from "react";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { useGitOpsForm } from "../../../providers/form/hooks";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { ciTool } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";

export const CiTool = () => {
  const form = useGitOpsForm();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  // Subscribe to gitServer field value
  const gitServerFieldValue = useStore(form.store, (state) => state.values[CODEBASE_FORM_NAMES.GIT_SERVER]);
  const selectedGitServer = gitServers.find((gitServer) => gitServer.metadata.name === gitServerFieldValue);

  const isGitlabProvider = selectedGitServer?.spec.gitProvider === "gitlab";

  const ciToolOptions = React.useMemo(
    () => [
      { label: "Tekton", value: ciTool.tekton },
      ...(isGitlabProvider ? [{ label: "GitLab CI", value: ciTool.gitlab }] : []),
    ],
    [isGitlabProvider]
  );

  return (
    <form.AppField name={CODEBASE_FORM_NAMES.CI_TOOL}>
      {(field) => <field.FormSelect label="CI Pipelines" options={ciToolOptions} disabled={!isGitlabProvider} />}
    </form.AppField>
  );
};
