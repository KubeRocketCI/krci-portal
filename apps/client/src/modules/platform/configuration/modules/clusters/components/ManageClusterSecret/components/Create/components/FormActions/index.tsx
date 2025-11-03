import { Button, Tooltip } from "@mui/material";
import React from "react";
import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { ManageClusterSecretDataContext, ManageClusterSecretValues } from "../../../../types";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useFormContext } from "@/core/providers/Form/hooks";
import { ClusterType, createClusterSecretDraft } from "@my-project/shared";

export const FormActions = ({ activeClusterType }: { activeClusterType: ClusterType }) => {
  const {
    formData: { handleClosePlaceholder },
  } = useFormContext<ManageClusterSecretDataContext>();

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useReactHookFormContext<ManageClusterSecretValues>();

  const handleClose = React.useCallback(() => {
    reset();

    if (handleClosePlaceholder) {
      handleClosePlaceholder();
    }
  }, [handleClosePlaceholder, reset]);

  const {
    triggerCreateSecret,
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const isLoading = React.useMemo(() => secretCreateMutation.isPending, [secretCreateMutation]);

  const onSubmit = React.useCallback(
    async (values: ManageClusterSecretValues) => {
      if (!secretPermissions.data.create.allowed) {
        return false;
      }

      const { clusterName, clusterHost, clusterToken, clusterCertificate, skipTLSVerify, roleARN, caData } = values;

      const secretDraft = createClusterSecretDraft({
        clusterType: activeClusterType,
        clusterName,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      });

      await triggerCreateSecret({
        data: {
          resource: secretDraft,
        },
        callbacks: {
          onSuccess: handleClose,
        },
      });
    },
    [activeClusterType, handleClose, secretPermissions.data.create.allowed, triggerCreateSecret]
  );

  return (
    <>
      <div className="flex justify-between gap-4">
        <div>
          <Button onClick={handleClosePlaceholder} size="small" component={"button"}>
            cancel
          </Button>
        </div>
        <div>
          <div className="flex items-center gap-4">
            <div>
              <Button
                onClick={() => reset({}, { keepDirty: false })}
                size="small"
                component={"button"}
                disabled={!isDirty}
              >
                undo changes
              </Button>
            </div>
            <div>
              <ConditionalWrapper
                condition={!secretPermissions.data.create.allowed}
                wrapper={(children) => (
                  <Tooltip title={secretPermissions.data.create.reason}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <Button
                  type={"button"}
                  size={"small"}
                  component={"button"}
                  variant={"contained"}
                  color={"primary"}
                  disabled={isLoading || !isDirty || !secretPermissions.data.create.allowed}
                  onClick={handleSubmit(onSubmit)}
                >
                  save
                </Button>
              </ConditionalWrapper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
