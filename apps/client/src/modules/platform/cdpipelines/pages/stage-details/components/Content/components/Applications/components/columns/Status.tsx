import { RefreshCw } from "lucide-react";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import { Application, getApplicationStatus, getApplicationSyncStatus } from "@my-project/shared";

export const StatusColumn = ({ application }: { application: Application | undefined }) => {
  if (!application) {
    return <span className="text-muted-foreground text-sm">N/A</span>;
  }

  const healthStatus = getApplicationStatus(application);
  const syncStatus = getApplicationSyncStatus(application);
  const healthStatusIcon = getApplicationStatusIcon(application);
  const syncStatusIcon = getApplicationSyncStatusIcon(application);

  return (
    <div className="flex items-center gap-2">
      <Badge className="h-6" style={{ backgroundColor: `${healthStatusIcon.color}15`, color: healthStatusIcon.color }}>
        <StatusIcon
          Icon={healthStatusIcon.component}
          color={healthStatusIcon.color}
          isSpinning={healthStatusIcon.isSpinning}
          width={12}
        />
        <span className="capitalize">{healthStatus.status}</span>
      </Badge>
      <Badge className="h-6" style={{ backgroundColor: `${syncStatusIcon.color}15`, color: syncStatusIcon.color }}>
        <RefreshCw className="size-3" />
        <span className="capitalize">{syncStatus.status}</span>
      </Badge>
    </div>
  );
};
