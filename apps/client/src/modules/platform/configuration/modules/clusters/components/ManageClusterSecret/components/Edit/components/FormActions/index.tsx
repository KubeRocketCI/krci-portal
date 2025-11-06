import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../../types";
import { ClusterCDPipelineConflictError } from "./components/ClusterCDPipelineConflictError";
import { useConflictedStageWatch } from "./hooks/useConflictedStage";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useFormContext } from "@/core/providers/Form/hooks";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Trash } from "lucide-react";
import { editClusterSecret, k8sSecretConfig } from "@my-project/shared";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";

export const FormActions = () => {
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);

  const {
    formData: { currentElement, ownerReference },
  } = useFormContext<ManageClusterSecretDataContext>();

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
    getValues,
  } = useReactHookFormContext<ManageClusterSecretValues>();

  const onSuccess = React.useCallback(() => {
    const values = getValues();
    reset(values);
  }, [getValues, reset]);

  const {
    triggerEditSecret,
    mutations: { secretEditMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const isLoading = React.useMemo(() => secretEditMutation.isPending, [secretEditMutation.isPending]);

  const onSubmit = React.useCallback(
    async (values: ManageClusterSecretValues) => {
      if (!secretPermissions.data.patch.allowed || !currentElement) {
        return false;
      }

      const {
        clusterName,
        clusterType,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      } = values;

      const newSecretDraft = editClusterSecret(currentElement, {
        clusterType,
        clusterName,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      });

      await triggerEditSecret({
        data: {
          resource: newSecretDraft,
        },
        callbacks: {
          onSuccess: onSuccess,
        },
      });
    },
    [currentElement, onSuccess, secretPermissions.data.patch.allowed, triggerEditSecret]
  );

  const clusterName = currentElement?.metadata.name;

  const conflictedStageQuery = useConflictedStageWatch(clusterName);

  const onBeforeSubmit = React.useCallback(
    async (
      setErrorTemplate: (errorTemplate: React.ReactNode) => void,
      setLoadingActive: (loadingActive: boolean) => void
    ) => {
      setLoadingActive(true);
      if (!conflictedStageQuery.data) {
        setLoadingActive(false);
        return;
      }

      setErrorTemplate(
        <ClusterCDPipelineConflictError conflictedStage={conflictedStageQuery.data} clusterName={clusterName} />
      );
      setLoadingActive(false);
    },
    [clusterName, conflictedStageQuery.data]
  );

  const handleClickDelete = React.useCallback(() => {
    if (!currentElement) {
      return;
    }

    openDeleteKubeObjectDialog({
      objectName: currentElement?.metadata.name,
      resourceConfig: k8sSecretConfig,
      resource: currentElement,
      description: `Confirm the deletion of the cluster.`,
      onBeforeSubmit,
    });
  }, [currentElement, onBeforeSubmit, openDeleteKubeObjectDialog]);

  const saveButtonTooltip = React.useMemo(() => {
    if (!secretPermissions.data.patch.allowed) {
      return secretPermissions.data.patch.reason;
    }

    if (ownerReference) {
      return `You cannot edit this integration because the secret has owner references.`;
    }

    return "";
  }, [ownerReference, secretPermissions.data.patch.allowed, secretPermissions.data.patch.reason]);

  const deleteButtonTooltip = React.useMemo(() => {
    if (!secretPermissions.data.delete.allowed) {
      return secretPermissions.data.delete.reason;
    }

    if (ownerReference) {
      return `You cannot delete this integration because the secret has owner references.`;
    }

    return "";
  }, [ownerReference, secretPermissions.data.delete.allowed, secretPermissions.data.delete.reason]);

  return (
    <>
      <div className="flex justify-between gap-4">
        <div>
          <ConditionalWrapper
            condition={!secretPermissions.data.delete.allowed || !!ownerReference}
            wrapper={(children) => (
              <Tooltip title={deleteButtonTooltip}>
                <div>{children}</div>
              </Tooltip>
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClickDelete}
              disabled={!secretPermissions.data.delete.allowed || !!ownerReference}
              data-test-id="delete_button"
            >
              <Trash size={20} />
            </Button>
          </ConditionalWrapper>
        </div>
        <div>
          <div className="flex items-center gap-4">
            <div>
              <Button onClick={() => reset()} size="sm" variant="ghost" disabled={!isDirty}>
                Undo Changes
              </Button>
            </div>
            <div>
              <ConditionalWrapper
                condition={!secretPermissions.data.patch.allowed || !!ownerReference}
                wrapper={(children) => (
                  <Tooltip title={saveButtonTooltip}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <Button
                  type={"button"}
                  size={"sm"}
                  variant={"default"}
                  disabled={isLoading || !isDirty || !secretPermissions.data.patch.allowed}
                  onClick={handleSubmit(onSubmit)}
                >
                  Save
                </Button>
              </ConditionalWrapper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
