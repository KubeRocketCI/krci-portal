import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useManageGitServerForm } from "../../providers/form/hooks";
import { useDataContext } from "../../providers/Data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Trash } from "lucide-react";
import { DeletionDialog } from "../DeletionDialog";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels } from "@my-project/shared";
import { useGitServerPermissions } from "@/k8s/api/groups/KRCI/GitServer";
import { useStore } from "@tanstack/react-form";

export const Actions = () => {
  const form = useManageGitServerForm();
  const { gitServer, gitServerSecret, handleClosePanel } = useDataContext();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const codebasesByGitServerWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.gitServer]: gitServer?.spec.gitProvider || "",
    },
  });

  const gitServerPermissions = useGitServerPermissions();

  const mode = gitServer ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const deletedDisabledState = React.useMemo(() => {
    if (gitServerSecret?.metadata?.ownerReferences?.length) {
      return {
        status: true,
        reason: `You cannot delete this Git Server because its Secret is managed by ${gitServerSecret.metadata.ownerReferences[0].kind}.`,
      };
    }

    if (codebasesByGitServerWatch.data.array?.length) {
      return {
        status: true,
        reason: "You cannot delete this Git Server because it has associated codebases.",
      };
    }

    if (!gitServerPermissions.data.delete.allowed) {
      return {
        status: true,
        reason: gitServerPermissions.data.delete.reason,
      };
    }

    return {
      status: false,
      reason: null as string | null,
    };
  }, [
    codebasesByGitServerWatch.data.array?.length,
    gitServerPermissions.data.delete.allowed,
    gitServerPermissions.data.delete.reason,
    gitServerSecret?.metadata?.ownerReferences,
  ]);

  const handleDelete = React.useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {mode === FORM_MODES.EDIT ? (
          <ConditionalWrapper
            condition={deletedDisabledState.status}
            wrapper={(children) => (
              <Tooltip title={deletedDisabledState.reason}>
                <div>{children}</div>
              </Tooltip>
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deletedDisabledState.status}
              aria-label="Delete"
            >
              <Trash size={20} />
            </Button>
          </ConditionalWrapper>
        ) : (
          <Button onClick={handleClosePanel} variant="ghost" size="sm">
            Cancel
          </Button>
        )}

        <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty} className="ml-auto">
          Undo Changes
        </Button>

        <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
          Save
        </Button>
      </div>
      <DeletionDialog
        gitServer={gitServer}
        gitServerSecret={gitServerSecret}
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
      />
    </>
  );
};
