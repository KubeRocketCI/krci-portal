import { ConditionsTable } from "@/modules/k8s/components/ConditionsTable";
import { PrinterColumnsRows } from "../components/PrinterColumnsRows";
import type { CRDObject, KubeCondition, KubeObjectBase } from "@my-project/shared";

export function CROverviewTab({ crd, item, version }: { crd: CRDObject; item: KubeObjectBase; version: string }) {
  const conditions = (item as { status?: { conditions?: KubeCondition[] } }).status?.conditions ?? [];
  return (
    <div className="space-y-6 p-4">
      <PrinterColumnsRows crd={crd} item={item} version={version} />
      {conditions.length > 0 && <ConditionsTable conditions={conditions} />}
    </div>
  );
}
