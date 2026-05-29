import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import z from "zod";
import { useAppForm } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { ErrorContent } from "@/core/components/ErrorContent";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useDeploymentRevisions } from "@/modules/k8s/hooks/useDeploymentRevisions";
import { useK8sRollback } from "@/modules/k8s/hooks/useK8sRollback";
import { formatRelativeTime } from "@/core/utils/date-humanize";
import type { RollbackDialogProps } from "./types";

const rollbackSchema = z.object({
  replicaSetUid: z.string().min(1, "Select a revision to roll back to"),
});

export function RollbackDialog({ props: { namespace, name }, state: { open, closeDialog } }: RollbackDialogProps) {
  const revisions = useDeploymentRevisions({ namespace, name });
  const rollback = useK8sRollback();

  // Derive the default revision to select (latest non-current revision).
  const defaultUid = (revisions.data ?? []).find((r) => !r.isCurrent)?.replicaSetUid ?? "";

  const form = useAppForm({
    defaultValues: { replicaSetUid: "" },
    validators: {
      onChange: rollbackSchema,
    },
    onSubmit: async ({ value }) => {
      closeDialog();
      rollback.mutate({ namespace, name, replicaSetUid: value.replicaSetUid });
    },
  });

  // Reset selection to empty whenever the dialog closes, and adopt the default
  // revision when the dialog is open and revisions have loaded. This also handles
  // the late-arrival case: the dialog opens before the first fetch resolves, then
  // defaultUid transitions from "" to a real UID and the effect re-runs to set it.
  useEffect(() => {
    if (!open) {
      form.reset({ replicaSetUid: "" });
      return;
    }
    if (defaultUid) {
      const current = form.getFieldValue("replicaSetUid");
      if (!current) {
        form.setFieldValue("replicaSetUid", defaultUid);
      }
    }
  }, [open, defaultUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedUid = useStore(form.store, (state) => state.values.replicaSetUid);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const hasRevisions = (revisions.data?.length ?? 0) >= 2;
  // Verify selectedUid is still in the (possibly background-refetched) revisions list,
  // and is not the current revision — a stale dialog won't let the user submit a UID
  // that no longer corresponds to a rollback-able ReplicaSet.
  const selectedIsValid =
    !!selectedUid && (revisions.data ?? []).some((r) => !r.isCurrent && r.replicaSetUid === selectedUid);
  const canSubmit = selectedIsValid && hasRevisions && !revisions.isLoading && !revisions.isError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Roll back {name}</DialogTitle>
          <DialogDescription>
            Select a previous revision to restore. The current revision is disabled.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            {revisions.isLoading && (
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            )}
            {revisions.isError && <ErrorContent error={revisions.error ?? null} />}
            {!revisions.isLoading && !revisions.isError && !hasRevisions && (
              <p className="text-muted-foreground text-sm">No previous revisions available.</p>
            )}
            {!revisions.isLoading && !revisions.isError && hasRevisions && (
              <form.AppField name="replicaSetUid">
                {(field) => (
                  <div role="radiogroup" aria-label="Revisions" className="max-h-96 overflow-y-auto">
                    <TableUI>
                      <TableHeaderUI>
                        <TableRowUI>
                          <TableHeadUI scope="col" className="px-2 py-1">
                            <span className="sr-only">Select</span>
                          </TableHeadUI>
                          <TableHeadUI scope="col" className="px-2 py-1">
                            Revision
                          </TableHeadUI>
                          <TableHeadUI scope="col" className="px-2 py-1">
                            Created
                          </TableHeadUI>
                          <TableHeadUI scope="col" className="px-2 py-1">
                            Images
                          </TableHeadUI>
                        </TableRowUI>
                      </TableHeaderUI>
                      <TableBodyUI>
                        {revisions.data!.map((r) => (
                          <TableRowUI key={r.replicaSetUid}>
                            <TableCellUI className="px-2 py-1">
                              <input
                                type="radio"
                                name="revision"
                                value={r.replicaSetUid}
                                checked={field.state.value === r.replicaSetUid}
                                onChange={() => {
                                  field.handleChange(r.replicaSetUid);
                                }}
                                onBlur={field.handleBlur}
                                disabled={r.isCurrent}
                                aria-label={`Revision ${r.revision}`}
                              />
                            </TableCellUI>
                            <TableCellUI className="px-2 py-1 font-mono">
                              {r.revision}{" "}
                              {r.isCurrent && <span className="ml-1 text-xs text-emerald-600">(current)</span>}
                            </TableCellUI>
                            <TableCellUI className="px-2 py-1">{formatRelativeTime(r.creationTimestamp)}</TableCellUI>
                            <TableCellUI className="px-2 py-1 font-mono text-xs">
                              <div className="w-full min-w-0">
                                <TextWithTooltip text={r.images.join(", ")} maxLineAmount={2} />
                              </div>
                            </TableCellUI>
                          </TableRowUI>
                        ))}
                      </TableBodyUI>
                    </TableUI>
                  </div>
                )}
              </form.AppField>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeDialog()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || rollback.isPending}
              aria-busy={isSubmitting || rollback.isPending}
            >
              Rollback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
