import { StatusIcon } from "@/core/components/StatusIcon";
import { getApplicationStatusIcon } from "@/core/k8s/api/groups/ArgoCD/Application";
import { Application, getApplicationStatus } from "@my-project/shared";

export const HealthColumn = ({ application }: { application: Application }) => {
  const status = getApplicationStatus(application);
  const statusIcon = getApplicationStatusIcon(application);

  return (
    <StatusIcon
      Title={`Health status: ${status.status || "Unknown"}`}
      Icon={statusIcon.component}
      color={statusIcon.color}
      isSpinning={statusIcon.isSpinning}
    />
  );
};
