import { StatusIcon } from "@/core/components/StatusIcon";
import { getApplicationSyncStatusIcon } from "@/core/k8s/api/groups/ArgoCD/Application";
import { Application, getApplicationSyncStatus } from "@my-project/shared";

export const SyncColumn = ({ application }: { application: Application }) => {
  const status = getApplicationSyncStatus(application);
  const statusIcon = getApplicationSyncStatusIcon(application);

  return (
    <StatusIcon
      Title={`Sync status: ${status.status || "Unknown"}`}
      Icon={statusIcon.component}
      color={statusIcon.color}
      isSpinning={statusIcon.isSpinning}
    />
  );
};
