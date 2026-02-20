import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { TableUI, TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import { useClusterStore } from "@/k8s/store";
import { PATH_CDPIPELINE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/details/route";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { k8sCodebaseConfig, k8sOperation, type Codebase } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { useDeletionConflicts } from "../../hooks/useDeletionConflicts";
import type { ComponentMultiDeletionProps } from "./types";
import type { ComponentsToDeleteConflicts } from "../../types";

const CONFIRM_TEXT_VALUE = "confirm";

interface ConflictsDialogProps {
  open: boolean;
  handleClose: () => void;
  conflicts: ComponentsToDeleteConflicts;
}

const ConflictsDialog = ({ open, handleClose, conflicts }: ConflictsDialogProps) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle size={20} className="text-destructive" />
            Cannot Delete Selected Projects
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              The following projects are used in Deployments and cannot be deleted. Please remove them from the
              associated Deployments first.
            </p>
            <div className="border-border rounded-md border">
              <TableUI>
                <TableHeaderUI>
                  <TableRowUI>
                    <TableHeadUI className="px-4 py-3">Project</TableHeadUI>
                    <TableHeadUI className="px-4 py-3">Type</TableHeadUI>
                    <TableHeadUI className="px-4 py-3">Conflicting Deployments</TableHeadUI>
                  </TableRowUI>
                </TableHeaderUI>
                <TableBodyUI>
                  {Array.from(conflicts.entries()).map(([name, { component, pipelines, stages }]) => (
                    <TableRowUI key={name}>
                      <TableCellUI className="px-4 py-3 font-medium">{name}</TableCellUI>
                      <TableCellUI className="px-4 py-3">{capitalizeFirstLetter(component.spec.type)}</TableCellUI>
                      <TableCellUI className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {pipelines.map((pipeline) => (
                            <Button
                              key={pipeline.metadata.name}
                              variant="link"
                              asChild
                              className="h-auto justify-start p-0"
                            >
                              <Link
                                to={PATH_CDPIPELINE_DETAILS_FULL}
                                params={{
                                  clusterName,
                                  name: pipeline.metadata.name,
                                  namespace: pipeline.metadata.namespace!,
                                }}
                                onClick={handleClose}
                              >
                                {pipeline.metadata.name}
                              </Link>
                            </Button>
                          ))}
                          {stages.map((stage) => (
                            <span key={stage.metadata.name} className="text-muted-foreground text-sm">
                              Stage: {stage.metadata.name}
                            </span>
                          ))}
                        </div>
                      </TableCellUI>
                    </TableRowUI>
                  ))}
                </TableBodyUI>
              </TableUI>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DeletionDialogProps {
  open: boolean;
  handleClose: () => void;
  onDelete: () => void;
  componentsToDelete: Codebase[];
}

const DeletionDialog = ({ open, handleClose, onDelete, componentsToDelete }: DeletionDialogProps) => {
  const [value, setValue] = React.useState("");

  const codebaseDeleteMutation = useResourceCRUDMutation<Codebase, typeof k8sOperation.delete>(
    "codebaseMultiDeleteMutation",
    k8sOperation.delete
  );

  const deletionDisabled = value !== CONFIRM_TEXT_VALUE;

  const handleDelete = async () => {
    if (deletionDisabled) {
      return;
    }

    try {
      await Promise.all(
        componentsToDelete.map((component) =>
          codebaseDeleteMutation.mutateAsync({
            resource: component,
            resourceConfig: k8sCodebaseConfig,
          })
        )
      );
      setValue("");
      onDelete();
    } catch {
      // Individual mutation errors are handled by React Query / mutation error handlers
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete {componentsToDelete.length} selected project(s)?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-delete">{`Enter "${CONFIRM_TEXT_VALUE}" to start deletion`}</Label>
            <Input id="confirm-delete" value={value} onChange={(e) => setValue(e.target.value)} className="w-full" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={deletionDisabled}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ComponentMultiDeletion = ({
  components,
  open,
  handleClose,
  selected,
  onDelete,
}: ComponentMultiDeletionProps) => {
  const componentsByNameMap = React.useMemo(
    () => new Map(components.map((component) => [component.metadata.name, component])),
    [components]
  );

  const { componentsToDelete, componentsToDeleteConflicts, isLoading } = useDeletionConflicts(
    selected,
    componentsByNameMap
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="w-full max-w-md">
          <DialogBody>
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-muted-foreground text-sm">Checking for conflicts...</span>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  const hasConflicts = componentsToDeleteConflicts !== null && componentsToDeleteConflicts.size > 0;

  if (hasConflicts) {
    return <ConflictsDialog open={open} handleClose={handleClose} conflicts={componentsToDeleteConflicts} />;
  }

  const deletableComponents = componentsToDelete ? Array.from(componentsToDelete.values()) : [];

  if (deletableComponents.length === 0) {
    return null;
  }

  return (
    <DeletionDialog
      open={open}
      handleClose={handleClose}
      onDelete={onDelete}
      componentsToDelete={deletableComponents}
    />
  );
};
