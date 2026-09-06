import { DonutChart, DonutLegend } from "@/core/components/charts/DonutChart";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Tooltip } from "@/core/components/ui/tooltip";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import { TriangleAlert } from "lucide-react";
import { Fragment } from "react";
import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import {
  useCDPipelinesHealth,
  useCodebaseBranchesHealth,
  useCodebasesHealth,
  useStagesHealth,
} from "../../hooks/useResourceHealth";
import { usePipelineRunsHealth } from "../../hooks/usePipelineRunsHealth";
import { describeStatusSlices, toResourceTileState, type ResourceTileState } from "../../utils/statusSegments";

const DONUT_SIZE = 56;
const DONUT_THICKNESS = 7;

function TileGraphic({ label, state }: { label: string; state: ResourceTileState }) {
  if (state.kind === "error") {
    const errorMessage = getK8sErrorMessage(state.error);

    return (
      <Tooltip title={errorMessage}>
        <div
          role="img"
          tabIndex={0}
          aria-label={`${label}: could not be loaded. ${errorMessage}`}
          className="focus-visible:ring-ring flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
          style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
        >
          <TriangleAlert size={24} color={STATUS_COLOR.UNKNOWN} />
        </div>
      </Tooltip>
    );
  }

  if (state.kind === "loading") {
    return <Skeleton className="rounded-full" style={{ width: DONUT_SIZE, height: DONUT_SIZE }} />;
  }

  return (
    <Tooltip
      title={
        state.slices.length > 0 ? <DonutLegend slices={state.slices} /> : <p>No {label.toLowerCase()} to report.</p>
      }
    >
      <div
        role="img"
        tabIndex={0}
        aria-label={describeStatusSlices(label, state.total, state.slices)}
        className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
      >
        <DonutChart
          data={state.slices}
          size={DONUT_SIZE}
          thickness={DONUT_THICKNESS}
          centerValue={state.total}
          centerValueClassName="text-sm"
        />
      </div>
    </Tooltip>
  );
}

function ResourceTile({ label, state }: { label: string; state: ResourceTileState }) {
  return (
    <div className="flex flex-col items-center p-3">
      <TileGraphic label={label} state={state} />
      <p className="text-foreground mt-2 text-center text-xs font-medium">{label}</p>
      {state.kind === "ready" && (
        <p aria-hidden className="mt-1 flex items-center gap-1 text-xs">
          {state.countRow.map((slice, index) => (
            <Fragment key={slice.name}>
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <span style={{ color: slice.color }}>{slice.value}</span>
            </Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

export function ResourceHealth() {
  const codebases = useCodebasesHealth();
  const branches = useCodebaseBranchesHealth();
  const pipelines = usePipelineRunsHealth();
  const cdPipelines = useCDPipelinesHealth();
  const stages = useStagesHealth();

  const resources = [
    { label: "Codebases", result: codebases },
    { label: "Branches", result: branches },
    { label: "Pipelines", result: pipelines },
    { label: "CD Pipelines", result: cdPipelines },
    { label: "Stages", result: stages },
  ];

  return (
    <DashboardCard title="Resource Health">
      <div className="grid grid-cols-5 gap-4">
        {resources.map(({ label, result }) => (
          <ResourceTile key={label} label={label} state={toResourceTileState(result)} />
        ))}
      </div>
    </DashboardCard>
  );
}
