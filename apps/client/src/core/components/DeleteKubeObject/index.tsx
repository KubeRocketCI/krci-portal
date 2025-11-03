import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import React from "react";
import { useForm } from "react-hook-form";
import { DIALOG_NAME_DELETE_KUBE_OBJECT } from "./constants";
import { DeleteKubeObjectDialogProps } from "./types";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, KubeObjectBase } from "@my-project/shared";
import { router } from "@/core/router";

const NAMES = {
  name: "name",
} as const;

const getDialogTitle = (errorTemplate: React.ReactNode, objectName: string): string =>
  !errorTemplate ? `Confirm deletion of "${objectName}"` : `Cannot start deleting "${objectName}"`;

export const DeleteKubeObjectDialog: React.FC<DeleteKubeObjectDialogProps> = (_props) => {
  const { props, state } = _props;
  const { open, closeDialog } = state;
  const { objectName, resource, resourceConfig, onBeforeSubmit, description, backRoute, createCustomMessages } = props;

  const [errorTemplate, setErrorTemplate] = React.useState<React.ReactNode | string>(null);
  const [loadingActive, setLoadingActive] = React.useState<boolean>(false);
  const { register, handleSubmit, watch, reset } = useForm<{ name: string }>();
  const kubeObjectNameFieldValue = watch(NAMES.name);

  const handleClosePopup = React.useCallback(
    (_?: unknown, reason?: string) => (reason !== "backdropClick" ? closeDialog() : false),
    [closeDialog]
  );

  const resourceDeleteMutation = useResourceCRUDMutation<KubeObjectBase, typeof k8sOperation.delete>(
    "resourceDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages,
    }
  );

  const onSubmit = React.useCallback(
    async ({ name }: { name: string }) => {
      if (errorTemplate || objectName !== name) {
        return;
      }

      handleClosePopup();

      await resourceDeleteMutation.mutate({
        resource,
        resourceConfig,
      });
      reset();

      if (backRoute) {
        router.navigate(backRoute);
      }
    },
    [errorTemplate, objectName, handleClosePopup, resourceDeleteMutation, resource, resourceConfig, reset, backRoute]
  );

  React.useEffect(() => {
    (async () => {
      const validateObject = async () => {
        if (onBeforeSubmit !== undefined && open) {
          await onBeforeSubmit(setErrorTemplate, setLoadingActive);
        }
      };

      await validateObject();
    })();
  }, [onBeforeSubmit, open]);

  const isSubmitNotAllowed = kubeObjectNameFieldValue !== objectName || !!errorTemplate;
  const dialogTitle = React.useMemo(() => getDialogTitle(errorTemplate, objectName || ""), [errorTemplate, objectName]);

  return (
    <Dialog open={open} onClose={handleClosePopup} fullWidth data-testid="dialog">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-2">
          {!loadingActive && !errorTemplate && (
            <div>
              <p>{description}</p>
            </div>
          )}
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-2">
                {!!loadingActive && (
                  <div className="flex justify-center">
                    <div>
                      <CircularProgress />
                    </div>
                  </div>
                )}
                {!!errorTemplate && !loadingActive && <div>{errorTemplate}</div>}
                {!loadingActive && !errorTemplate && (
                  <div>
                    <TextField
                      {...register(NAMES.name, { required: true })}
                      label={`Enter "${objectName}" to delete`}
                      variant="outlined"
                      fullWidth
                    />
                  </div>
                )}
                <div>
                  <DialogActions>
                    <Button type={"button"} onClick={handleClosePopup}>
                      Cancel
                    </Button>
                    <Button type={"submit"} disabled={isSubmitNotAllowed}>
                      Confirm
                    </Button>
                  </DialogActions>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

DeleteKubeObjectDialog.displayName = DIALOG_NAME_DELETE_KUBE_OBJECT;
