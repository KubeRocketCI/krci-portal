import { useState } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog/index";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

interface Props<T extends KubeObjectBase> {
  items: T[];
  config: K8sResourceConfig;
  onDeleted?: () => void;
}

export function BatchDeleteAction<T extends KubeObjectBase>({ items, config, onDeleted }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((s) => ({ clusterName: s.clusterName })));

  if (items.length === 0) return null;

  const handleConfirm = async () => {
    setBusy(true);
    const results = await Promise.allSettled(
      items.map((item) =>
        trpc.k8s.delete.mutate({
          clusterName,
          namespace: item.metadata?.namespace ?? "",
          name: item.metadata?.name ?? "",
          resourceConfig: config,
        })
      )
    );
    setBusy(false);
    setOpen(false);

    const failures = results
      .map((r, i) => ({ result: r, item: items[i] }))
      .filter(({ result }) => result.status === "rejected");

    if (failures.length === 0) {
      showToast(`Deleted ${items.length} ${config.pluralName}`, "success");
    } else {
      showToast(
        `${items.length - failures.length}/${items.length} deleted; ${failures.length} failed`,
        failures.length === items.length ? "error" : "warning"
      );
      for (const { item, result } of failures) {
        const message = result.status === "rejected" ? ((result.reason as Error)?.message ?? "") : "";
        showToast(`Failed: ${item.metadata?.name ?? ""}${message ? ` — ${message}` : ""}`, "error");
      }
    }

    onDeleted?.();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={busy}>
        <Trash size={14} className="mr-1.5" /> Delete {items.length}
      </Button>
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {items.length} {config.pluralName}?
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">This will delete the following resources:</p>
            <ul className="mt-2 max-h-64 overflow-y-auto font-mono text-sm">
              {items.map((i) => (
                <li key={i.metadata?.uid}>
                  {i.metadata?.namespace ? `${i.metadata.namespace}/` : ""}
                  {i.metadata?.name}
                </li>
              ))}
            </ul>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
