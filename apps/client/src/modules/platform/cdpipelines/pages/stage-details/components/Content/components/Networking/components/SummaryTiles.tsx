import { WorkloadSummaryCard, WorkloadSummaryGrid } from "@/modules/k8s/components/workload";
import type { NetworkingData } from "../types";

interface SummaryTilesProps {
  data: NetworkingData;
}

export function SummaryTiles({ data }: SummaryTilesProps) {
  const secCount = data.policies.filter((p) => p.kind === "SecurityPolicy").length;
  const btpCount = data.policies.filter((p) => p.kind === "BackendTrafficPolicy").length;
  const ctpCount = data.policies.filter((p) => p.kind === "ClientTrafficPolicy").length;

  const policySub =
    data.policies.length === 0
      ? "none"
      : [secCount > 0 && `Sec:${secCount}`, btpCount > 0 && `BTP:${btpCount}`, ctpCount > 0 && `CTP:${ctpCount}`]
          .filter(Boolean)
          .join(" ");

  return (
    <WorkloadSummaryGrid>
      <WorkloadSummaryCard label="Gateways" value={data.gateways.length} sub="resources" />
      <WorkloadSummaryCard label="HTTPRoutes" value={data.httpRoutes.length} sub="resources" />
      <WorkloadSummaryCard label="Ingresses" value={data.ingresses.length} sub="resources" />
      <WorkloadSummaryCard label="Policies" value={data.policies.length} sub={policySub} />
    </WorkloadSummaryGrid>
  );
}
