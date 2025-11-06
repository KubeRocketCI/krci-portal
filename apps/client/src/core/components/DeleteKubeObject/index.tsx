import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Button } from "@/core/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
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
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<{ name: string }>();
  const kubeObjectNameFieldValue = watch(NAMES.name);

  const handleClosePopup = React.useCallback(() => closeDialog(), [closeDialog]);

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
    <Dialog open={open} onOpenChange={(open) => !open && handleClosePopup()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            {!loadingActive && !errorTemplate && (
              <div>
                <p>{description}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
              {!!loadingActive && (
                <div className="flex justify-center">
                  <div>
                    <LoadingSpinner />
                  </div>
                </div>
              )}
              {!!errorTemplate && !loadingActive && <div>{errorTemplate}</div>}
              {!loadingActive && !errorTemplate && (
                <FormTextField
                  name={NAMES.name}
                  control={control}
                  errors={errors}
                  label={`Enter "${objectName}" to delete`}
                  rules={{ required: true }}
                />
              )}
            </form>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClosePopup}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={handleSubmit(onSubmit)} disabled={isSubmitNotAllowed}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

DeleteKubeObjectDialog.displayName = DIALOG_NAME_DELETE_KUBE_OBJECT;
