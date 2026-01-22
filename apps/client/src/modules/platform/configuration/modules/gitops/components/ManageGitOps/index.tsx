import React from "react";
import { Create } from "./components/Create";
import { FormActions } from "./components/FormActions";
import { View } from "./components/View";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { GitOpsFormProvider } from "./providers/form/provider";
import { GitOpsDataProvider } from "./providers/data/provider";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, createCodebaseDraftObject } from "@my-project/shared/models/k8s/groups/KRCI/Codebase";
import type { ManageGitOpsProps, ManageGitOpsValues } from "./types";

export const ManageGitOps = ({ formData }: ManageGitOpsProps) => {
  const baseDefaultValues = useDefaultValues({ formData });
  const { isReadOnly, handleClosePlaceholder } = formData;

  const { triggerCreateCodebase } = useCodebaseCRUD();

  const handleSubmit = React.useCallback(
    async (values: ManageGitOpsValues) => {
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
          onSuccess: handleClosePlaceholder,
        },
      });
    },
    [handleClosePlaceholder, triggerCreateCodebase]
  );

  return (
    <GitOpsDataProvider formData={formData}>
      <GitOpsFormProvider defaultValues={baseDefaultValues} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4" data-testid="form">
          <div>{isReadOnly ? <View /> : <Create />}</div>
          <div>
            <FormActions />
          </div>
        </div>
      </GitOpsFormProvider>
    </GitOpsDataProvider>
  );
};
