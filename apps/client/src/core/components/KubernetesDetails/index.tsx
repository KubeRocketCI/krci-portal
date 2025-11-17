import { DialogProps } from "@/core/providers/Dialog/types";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { InfoColumns } from "@/core/components/InfoColumns";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

type KubernetesDetailsDialogProps = DialogProps<object>;

export default function KubernetesDetailsDialog({ state }: KubernetesDetailsDialogProps) {
  const { open, closeDialog } = state;
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const configQuery = useQuery({
    queryKey: ["server.config"],
    queryFn: () => trpc.config.get.query(),
    enabled: open,
  });

  const clusterDetailsQuery = useQuery({
    queryKey: ["k8s.clusterDetails"],
    queryFn: () => trpc.k8s.clusterDetails.query(),
    enabled: open,
  });

  const infoRows = [
    [
      {
        label: "Cluster Name",
        text: clusterName || configQuery.data?.clusterName || clusterDetailsQuery.data?.clusterName || "N/A",
        columnXs: 6,
      },
      {
        label: "Default Namespace",
        text:
          defaultNamespace || configQuery.data?.defaultNamespace || clusterDetailsQuery.data?.defaultNamespace || "N/A",
        columnXs: 6,
      },
    ],
    [
      {
        label: "API Server URL",
        text: clusterDetailsQuery.data?.apiServerUrl || "N/A",
        columnXs: 12,
      },
    ],
    [
      {
        label: "Kubernetes Version",
        text: clusterDetailsQuery.data?.gitVersion || "N/A",
        columnXs: 4,
      },
      {
        label: "Platform",
        text: clusterDetailsQuery.data?.platform || "N/A",
        columnXs: 4,
      },
      {
        label: "Go Version",
        text: clusterDetailsQuery.data?.goVersion || "N/A",
        columnXs: 4,
      },
    ],
  ];

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kubernetes Details</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {configQuery.isLoading || clusterDetailsQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading cluster details...
            </div>
          ) : (
            <InfoColumns infoRows={infoRows} />
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={closeDialog}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
