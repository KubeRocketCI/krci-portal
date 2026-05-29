import { ConditionsTable } from "@/modules/k8s/components/ConditionsTable";
import { NamesCard } from "../components/NamesCard";
import { ScopeGroupConversionRow } from "../components/ScopeGroupConversionRow";
import { VersionsCard } from "../components/VersionsCard";
import type { CRDObject } from "@my-project/shared";

export function CRDOverviewTab({ item }: { item: CRDObject }) {
  return (
    <div className="space-y-6 p-4">
      <NamesCard crd={item} />
      <VersionsCard crd={item} />
      <ScopeGroupConversionRow crd={item} />
      <ConditionsTable conditions={item.status?.conditions ?? []} />
    </div>
  );
}
