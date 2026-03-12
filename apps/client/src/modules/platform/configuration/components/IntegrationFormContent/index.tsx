import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ShieldAlert, Trash } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { k8sSecretConfig, Secret } from "@my-project/shared";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface IntegrationFormContentProps {
  serviceLabel: string;
  secret: Secret;
  ownerReference: string | undefined;
  statusIcon: K8sResourceStatusIcon;
  statusTooltip: string | React.ReactElement;
  children: React.ReactNode;
}

export function IntegrationFormContent({
  serviceLabel,
  secret,
  ownerReference,
  statusIcon,
  statusTooltip,
  children,
}: IntegrationFormContentProps) {
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const secretPermissions = useSecretPermissions();
  const canDelete = !ownerReference && secretPermissions.data.delete.allowed;
  const deleteDisabledTooltip = ownerReference
    ? "You cannot delete this integration because the secret has owner references."
    : secretPermissions.data.delete.reason;

  const handleDelete = React.useCallback(() => {
    if (!canDelete || !secret) return;

    openDeleteKubeObjectDialog({
      objectName: secret.metadata.name,
      resourceConfig: k8sSecretConfig,
      resource: secret,
      description: `Confirm the deletion of the integration.`,
      createCustomMessages: (item) => ({
        loading: {
          message: `${item.metadata.name} has been marked for deletion`,
        },
        error: {
          message: `Failed to initiate ${item.metadata.name}'s deletion`,
        },
        success: {
          message: "The deletion process has been started",
        },
      }),
    });
  }, [canDelete, openDeleteKubeObjectDialog, secret]);

  return (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger className="cursor-default">
          <div className="flex w-full items-center justify-between">
            <div className="flex w-full flex-col items-start gap-1">
              <h6 className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <div className="mr-1">
                    <StatusIcon Icon={statusIcon.component} color={statusIcon.color} Title={statusTooltip} />
                  </div>
                  <div>{secret.metadata.name}</div>
                  {!!ownerReference && (
                    <div>
                      <Tooltip title={`Managed by ${ownerReference}`}>
                        <ShieldAlert size={20} />
                      </Tooltip>
                    </div>
                  )}
                </div>
              </h6>
              <p className="text-muted-foreground text-sm">{serviceLabel}</p>
            </div>
            <ConditionalWrapper
              condition={!canDelete}
              wrapper={(children) => (
                <Tooltip title={deleteDisabledTooltip}>
                  <div>{children}</div>
                </Tooltip>
              )}
            >
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={!canDelete}
                aria-label="Delete"
              >
                <Trash size={20} />
                Delete
              </Button>
            </ConditionalWrapper>
          </div>
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
