import { Card, CardContent } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { CHART_STATUS_COLOR } from "@/k8s/constants/colors";
import { ArrowRight, Loader2 } from "lucide-react";
import { useCodebasesGraphData } from "../CodebasesGraph/hooks/useCodebasesGraphData";
import { useCodebaseBranchesGraphData } from "../CodebaseBranchesGraph/hooks/useCodebaseBranchesGraphData";
import { usePipelineRunsGraphData } from "../PipelineRunsGraph/hooks/usePipelineRunsGraphData";
import { useCDPipelinesGraphData } from "../CDPipelinesGraph/hooks/useCDPipelinesGraphData";
import { useStagesGraphData } from "../StagesGraph/hooks/useStagesGraphData";

const DONUT_RADIUS = 20;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_OFFSET = DONUT_CIRCUMFERENCE / 4;

function CompactDonut({ ok, failed, total, size = 56 }: { ok: number; failed: number; total: number; size?: number }) {
  // Validate data integrity
  if (total === 0 || ok + failed > total || ok < 0 || failed < 0) {
    // Handle invalid data by showing just the total
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
        <circle cx="24" cy="24" r={DONUT_RADIUS} fill="none" className="stroke-border" strokeWidth="6" />
        <text x="24" y="27" textAnchor="middle" fontSize="10" className="fill-foreground" fontWeight="600">
          {total}
        </text>
      </svg>
    );
  }

  const okLen = (ok / total) * DONUT_CIRCUMFERENCE;
  const failLen = (failed / total) * DONUT_CIRCUMFERENCE;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={DONUT_RADIUS} fill="none" className="stroke-border" strokeWidth="6" />
      {okLen > 0 && (
        <circle
          cx="24"
          cy="24"
          r={DONUT_RADIUS}
          fill="none"
          stroke={CHART_STATUS_COLOR.SUCCESS}
          strokeWidth="6"
          strokeDasharray={`${okLen} ${DONUT_CIRCUMFERENCE - okLen}`}
          strokeDashoffset={DONUT_OFFSET}
        />
      )}
      {failLen > 0 && (
        <circle
          cx="24"
          cy="24"
          r={DONUT_RADIUS}
          fill="none"
          stroke={CHART_STATUS_COLOR.ERROR}
          strokeWidth="6"
          strokeDasharray={`${failLen} ${DONUT_CIRCUMFERENCE - failLen}`}
          strokeDashoffset={DONUT_OFFSET - okLen}
        />
      )}
      <text x="24" y="27" textAnchor="middle" fontSize="10" className="fill-foreground" fontWeight="600">
        {total}
      </text>
    </svg>
  );
}

interface ResourceItemProps {
  label: string;
  ok: number;
  failed: number;
  total: number;
  isLoading: boolean;
}

function ResourceItem({ label, ok, failed, total, isLoading }: ResourceItemProps) {
  return (
    <div className="hover:bg-muted/50 flex cursor-pointer flex-col items-center rounded-lg p-3 transition-colors">
      {isLoading ? (
        <div className="flex size-14 items-center justify-center">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : (
        <CompactDonut ok={ok} failed={failed} total={total} />
      )}
      <p className="text-foreground mt-2 text-center text-xs font-medium">{label}</p>
      {!isLoading && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span style={{ color: CHART_STATUS_COLOR.SUCCESS }}>{ok}</span>
          <span className="text-muted-foreground">/</span>
          <span style={{ color: CHART_STATUS_COLOR.ERROR }}>{failed}</span>
        </div>
      )}
    </div>
  );
}

export function ResourceHealth() {
  const codebases = useCodebasesGraphData();
  const branches = useCodebaseBranchesGraphData();
  const pipelines = usePipelineRunsGraphData();
  const cdPipelines = useCDPipelinesGraphData();
  const stages = useStagesGraphData();

  const resources = [
    { label: "Codebases", data: codebases.graphData, isLoading: codebases.isLoading },
    { label: "Branches", data: branches.graphData, isLoading: branches.isLoading },
    { label: "Pipelines", data: pipelines.graphData, isLoading: pipelines.isLoading },
    { label: "CD Pipelines", data: cdPipelines.graphData, isLoading: cdPipelines.isLoading },
    { label: "Stages", data: stages.graphData, isLoading: stages.isLoading },
  ];

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-base font-medium">Resource Health</h2>
          <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-sm">
            View All
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {resources.map((resource) => (
            <ResourceItem
              key={resource.label}
              label={resource.label}
              ok={resource.data.ok ?? 0}
              failed={resource.data.error ?? 0}
              total={resource.data.total ?? 0}
              isLoading={resource.isLoading}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
