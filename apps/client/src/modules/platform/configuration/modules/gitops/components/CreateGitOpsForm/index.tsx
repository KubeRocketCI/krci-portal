import React from "react";
import { CreateGitOpsFormProvider } from "./providers/form/provider";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, createCodebaseDraftObject } from "@my-project/shared/models/k8s/groups/KRCI/Codebase";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import {
  ciTool,
  codebaseCreationStrategy,
  codebaseDeploymentScript,
  codebaseType,
  codebaseVersioning,
} from "@my-project/shared";
import type { CreateGitOpsFormValues } from "./types";
import { GIT_OPS_CODEBASE_NAME } from "./constants";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";

export type { CreateGitOpsFormProps } from "./types";

export const CreateGitOpsForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { triggerCreateCodebase } = useCodebaseCRUD();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;
  const firstValidGitServer = gitServers?.find((gitServer) => gitServer?.status?.connected);

  const defaultValues = React.useMemo<CreateGitOpsFormValues>(
    () => ({
      emptyProject: false,
      name: GIT_OPS_CODEBASE_NAME,
      gitUrlPath: `/${GIT_OPS_CODEBASE_NAME}`,
      lang: "helm",
      framework: "gitops",
      buildTool: "helm",
      ciTool: ciTool.tekton,
      gitServer: firstValidGitServer?.metadata.name || "",
      defaultBranch: "main",
      deploymentScript: codebaseDeploymentScript["helm-chart"],
      description: "Custom values for deploy applications",
      strategy: codebaseCreationStrategy.create,
      type: codebaseType.system,
      versioningType: codebaseVersioning.semver,
      versioningStartFrom: "0.1.0-SNAPSHOT",
      systemTypeLabel: "gitops",
      namespace: "",
      gitRepoPath: "",
    }),
    [firstValidGitServer?.metadata.name]
  );

  const handleSubmit = React.useCallback(
    async (values: CreateGitOpsFormValues) => {
      const newCodebaseDraft = createCodebaseDraftObject({
        name: values.name,
        gitServer: values.gitServer,
        gitUrlPath: values.gitUrlPath,
        type: values.type,
        buildTool: values.buildTool,
        defaultBranch: values.defaultBranch,
        deploymentScript: values.deploymentScript,
        emptyProject: values.emptyProject,
        framework: values.framework,
        lang: values.lang,
        private: false,
        repositoryUrl: null,
        strategy: values.strategy,
        versioningType: values.versioningType,
        versioningStartFrom: values.versioningStartFrom,
        ciTool: values.ciTool,
        labels: {
          [codebaseLabels.systemType]: "gitops",
          [codebaseLabels.codebaseType]: values.type,
        },
      });

      await triggerCreateCodebase({
        data: {
          codebase: newCodebaseDraft,
          codebaseAuth: null,
        },
        callbacks: {
          onSuccess: onClose,
        },
      });
    },
    [onClose, triggerCreateCodebase]
  );

  return (
    <CreateGitOpsFormProvider defaultValues={defaultValues} onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <Form />
        <FormActions onClose={onClose} />
      </div>
    </CreateGitOpsFormProvider>
  );
};
