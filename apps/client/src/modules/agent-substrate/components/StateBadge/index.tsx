import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import type { K8sResourceStatusIcon } from "@/k8s/types";

/** The PipelineRun status badge look: tinted with the state colour, with its icon. */
export function StateBadge({ label, icon }: { label: string; icon: K8sResourceStatusIcon }) {
  return (
    <Badge
      className="h-6 max-w-full min-w-0 shrink justify-start"
      style={{ backgroundColor: `${icon.color}15`, color: icon.color }}
    >
      <span className="inline-flex shrink-0">
        <StatusIcon Icon={icon.component} color={icon.color} isSpinning={icon.isSpinning} width={12} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Badge>
  );
}
