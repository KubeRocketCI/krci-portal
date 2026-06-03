import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { Pod } from "@my-project/shared";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import { DonutCardBody, type DonutSlice } from "./DonutChart";
import { POD_PHASE_COLOR } from "../utils/status-color";

const PHASE_ORDER = ["Running", "Pending", "Succeeded", "Failed", "Unknown"];

export function PodPhaseCard({ result }: { result: UseWatchListResult<Pod> }) {
  const pods = result.data.array;

  const slices = useMemo<DonutSlice[]>(() => {
    const counts = new Map<string, number>();
    for (const pod of pods) {
      const phase = pod.status?.phase ?? "Unknown";
      counts.set(phase, (counts.get(phase) ?? 0) + 1);
    }
    return [...counts.keys()]
      .sort((a, b) => orderIndex(a) - orderIndex(b))
      .map((name) => ({ name, value: counts.get(name) ?? 0, color: POD_PHASE_COLOR[name] ?? STATUS_COLOR.UNKNOWN }));
  }, [pods]);

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-semibold">Pods by phase</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4 p-3 pt-1">
        <DonutCardBody
          slices={slices}
          isLoading={result.isLoading}
          size={104}
          thickness={13}
          centerValue={pods.length}
          centerLabel="pods"
          emptyText="No pods"
        />
      </CardContent>
    </Card>
  );
}

function orderIndex(phase: string): number {
  const index = PHASE_ORDER.indexOf(phase);
  return index === -1 ? PHASE_ORDER.length : index;
}
