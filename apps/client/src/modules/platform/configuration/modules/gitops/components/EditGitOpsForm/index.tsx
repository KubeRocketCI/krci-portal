import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { EditGitOpsFormProvider } from "./providers/form/provider";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import type { Codebase } from "@my-project/shared";
import type { EditGitOpsFormValues } from "./types";
import { CODEBASE_FORM_NAMES } from "./constants";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";

export type { EditGitOpsFormProps } from "./types";

export const EditGitOpsForm: React.FC<{
  codebase: Codebase;
  onClose: () => void;
}> = ({ codebase, onClose }) => {
  const { triggerPatchCodebase } = useCodebaseCRUD();

  const defaultValues = React.useMemo<EditGitOpsFormValues>(() => {
    const gitUrlPath = codebase?.spec.gitUrlPath || "";
    const gitUrlPathWithNoSlashAtTheStart = gitUrlPath.replace(/^\/+/, "");
    const gitRepoPath = gitUrlPathWithNoSlashAtTheStart.split("/").slice(0, -1).join("/");

    return {
      [CODEBASE_FORM_NAMES.GIT_SERVER]: codebase?.spec.gitServer || "",
      [CODEBASE_FORM_NAMES.GIT_REPO_PATH]: gitRepoPath,
      [CODEBASE_FORM_NAMES.NAME]: codebase?.metadata.name || "",
    };
  }, [codebase]);

  const handleSubmit = React.useCallback(
    async (values: EditGitOpsFormValues) => {
      try {
        const updatedCodebase: Codebase = {
          ...codebase,
          spec: {
            ...codebase.spec,
            gitServer: values.gitServer,
            gitUrlPath: values.gitRepoPath ? `/${values.gitRepoPath}/${values.name}` : `/${values.name}`,
          },
          metadata: {
            ...codebase.metadata,
            name: values.name,
          },
        };

        await triggerPatchCodebase({
          data: {
            codebase: updatedCodebase,
          },
          callbacks: {
            onSuccess: () => {
              onClose();
            },
          },
        });
      } catch (error) {
        console.error("Failed to update GitOps repository:", error);
        throw error;
      }
    },
    [codebase, triggerPatchCodebase, onClose]
  );

  return (
    <EditGitOpsFormProvider defaultValues={defaultValues} onSubmit={handleSubmit}>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-xl font-medium">Edit GitOps Repository</DialogTitle>
          </div>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <Form />
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions onClose={onClose} />
      </DialogFooter>
    </EditGitOpsFormProvider>
  );
};
