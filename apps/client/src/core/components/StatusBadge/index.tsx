import { StatusIcon } from "@/core/components/StatusIcon";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface StatusBadgeProps {
  statusIcon: K8sResourceStatusIcon;
  label: string;
}

export function StatusBadge({ statusIcon, label }: StatusBadgeProps) {
  return (
    <div
      className="flex h-6 w-fit items-center gap-1 rounded px-2 py-0.5 text-xs"
      style={{ backgroundColor: `${statusIcon.color}15`, color: statusIcon.color }}
    >
      <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} width={12} />
      <span className="capitalize">{label}</span>
    </div>
  );
}
