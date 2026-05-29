import { ConditionsTable } from "@/modules/k8s/components/ConditionsTable";
import type { KubeCondition, Pod } from "@my-project/shared";

export function ConditionsTab({ pod }: { pod: Pod }) {
  const conditions = (pod.status?.conditions ?? []) as KubeCondition[];
  return (
    <div className="p-4">
      <div className="bg-card rounded-md border">
        <ConditionsTable conditions={conditions} />
      </div>
    </div>
  );
}
