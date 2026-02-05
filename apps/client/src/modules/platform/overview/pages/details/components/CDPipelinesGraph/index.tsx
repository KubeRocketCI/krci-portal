import { PercentageCircleChart } from "@/modules/platform/overview/components/PercentageCircleChart";
import { CHART_STATUS_COLOR } from "@/k8s/constants/colors";
import { LegendListItem } from "../LegendListItem";
import { useCDPipelinesGraphData } from "./hooks/useCDPipelinesGraphData";

export const CDPipelinesGraph = () => {
  const { graphData, error } = useCDPipelinesGraphData();

  return (
    <PercentageCircleChart
      error={error}
      total={graphData.total === null ? -1 : graphData.total}
      data={[
        {
          name: "OK",
          value: graphData.ok!,
          fill: CHART_STATUS_COLOR.SUCCESS,
        },
        {
          name: "In Progress",
          value: graphData.inProgress!,
          fill: CHART_STATUS_COLOR.IN_PROGRESS,
        },
        {
          name: "Failed",
          value: graphData.error!,
          fill: CHART_STATUS_COLOR.ERROR,
        },
        {
          name: "Unknown",
          value: graphData.unknown!,
          fill: CHART_STATUS_COLOR.UNKNOWN,
        },
      ]}
      title={`Deployments (${graphData.total || 0})`}
      legend={
        <div className="flex flex-col gap-1">
          {!!graphData.ok && <LegendListItem color={CHART_STATUS_COLOR.SUCCESS} number={graphData.ok} label="Ok" />}
          {!!graphData.error && (
            <LegendListItem color={CHART_STATUS_COLOR.ERROR} number={graphData.error} label="Failed" />
          )}
          {!!graphData.inProgress && (
            <LegendListItem color={CHART_STATUS_COLOR.IN_PROGRESS} number={graphData.inProgress} label="In Progress" />
          )}
          {!!graphData.unknown && (
            <LegendListItem color={CHART_STATUS_COLOR.UNKNOWN} number={graphData.unknown} label="Unknown" />
          )}
        </div>
      }
      thickness={20}
    />
  );
};
