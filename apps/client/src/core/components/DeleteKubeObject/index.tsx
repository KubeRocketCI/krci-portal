import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import React from "react";
import { DIALOG_NAME_DELETE_KUBE_OBJECT } from "./constants";
import { DeleteKubeObjectDialogProps } from "./types";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, KubeObjectBase } from "@my-project/shared";
import { router } from "@/core/router";

const getDialogTitle = (errorTemplate: React.ReactNode, objectName: string): string =>
  !errorTemplate ? `Confirm deletion of "${objectName}"` : `Cannot start deleting "${objectName}"`;

export const DeleteKubeObjectDialog: React.FC<DeleteKubeObjectDialogProps> = (_props) => {
  const { props, state } = _props;
  const { open, closeDialog } = state;
  const { objectName, resource, resourceConfig, onBeforeSubmit, description, backRoute, createCustomMessages } = props;

  const [errorTemplate, setErrorTemplate] = React.useState<React.ReactNode | string>(null);
  const [loadingActive, setLoadingActive] = React.useState<boolean>(false);
  const [nameValue, setNameValue] = React.useState("");

  const handleClosePopup = React.useCallback(() => {
    closeDialog();
    setNameValue("");
  }, [closeDialog]);

  const resourceDeleteMutation = useResourceCRUDMutation<KubeObjectBase, typeof k8sOperation.delete>(
    "resourceDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages,
    }
  );

  const onSubmit = React.useCallback(async () => {
    if (errorTemplate || objectName !== nameValue) {
      return;
    }

    handleClosePopup();

    await resourceDeleteMutation.mutate({
      resource,
      resourceConfig,
    });

    if (backRoute) {
      router.navigate(backRoute);
    }
  }, [
    errorTemplate,
    objectName,
    nameValue,
    handleClosePopup,
    resourceDeleteMutation,
    resource,
    resourceConfig,
    backRoute,
  ]);

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

  const isSubmitNotAllowed = nameValue !== objectName || !!errorTemplate;
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
            <div className="flex flex-col gap-2">
              {!!loadingActive && (
                <div className="flex justify-center">
                  <div>
                    <LoadingSpinner />
                  </div>
                </div>
              )}
              {!!errorTemplate && !loadingActive && <div>{errorTemplate}</div>}
              {!loadingActive && !errorTemplate && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="delete-confirm-input">Enter &quot;{objectName}&quot; to delete</Label>
                  <Input
                    id="delete-confirm-input"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder=""
                  />
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClosePopup}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={onSubmit} disabled={isSubmitNotAllowed}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

DeleteKubeObjectDialog.displayName = DIALOG_NAME_DELETE_KUBE_OBJECT;
