import { ConditionsTable } from "@/modules/k8s/components/ConditionsTable";
import type { KubeCondition, Node } from "@my-project/shared";

export function ConditionsTab({ node }: { node: Node }) {
  const conditions = ((node as { status?: { conditions?: KubeCondition[] } }).status?.conditions ??
    []) as KubeCondition[];
  return (
    <div className="p-4">
      <div className="bg-card rounded-md border">
        <ConditionsTable conditions={conditions} />
      </div>
    </div>
  );
}
