import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { TektonSummaryItem, PIPELINE_TYPES, TektonResultsPipelineType } from "@my-project/shared";
import { Hammer, GitPullRequest, Rocket, Loader2, LucideIcon } from "lucide-react";
import { MAIN_COLOR } from "@/k8s/constants/colors";

export interface PipelineTypeBreakdownProps {
  metrics: Record<TektonResultsPipelineType, TektonSummaryItem | null>;
  isLoading?: boolean;
}

interface TypeConfig {
  label: string;
  Icon: LucideIcon;
  description: string;
}

const TYPE_CONFIG: Record<TektonResultsPipelineType, TypeConfig> = {
  [PIPELINE_TYPES.BUILD]: {
    label: "Build Pipelines",
    Icon: Hammer,
    description: "Source code builds",
  },
  [PIPELINE_TYPES.REVIEW]: {
    label: "Review Pipelines",
    Icon: GitPullRequest,
    description: "PR/MR reviews",
  },
  [PIPELINE_TYPES.DEPLOY]: {
    label: "Deploy Pipelines",
    Icon: Rocket,
    description: "Environment deployments",
  },
};

const PIPELINE_TYPE_ORDER: TektonResultsPipelineType[] = [
  PIPELINE_TYPES.BUILD,
  PIPELINE_TYPES.REVIEW,
  PIPELINE_TYPES.DEPLOY,
];

interface PipelineTypeCardProps {
  type: TektonResultsPipelineType;
  metrics: TektonSummaryItem | null;
  isLoading?: boolean;
}

function PipelineTypeCard({ type, metrics, isLoading }: PipelineTypeCardProps) {
  const config = TYPE_CONFIG[type];
  const { Icon } = config;
  const total = metrics?.total ?? 0;
  const succeeded = metrics?.succeeded ?? 0;
  const failed = metrics?.failed ?? 0;
  const successRate = total > 0 ? Math.round((succeeded / total) * 100) : null;

  const successRateColor =
    successRate !== null && successRate < 100 ? MAIN_COLOR.ORANGE : MAIN_COLOR.GREEN;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground size-5" />
          <CardTitle className="text-base font-medium">{config.label}</CardTitle>
        </div>
        <p className="text-muted-foreground text-xs">{config.description}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="text-lg font-semibold">{total}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Success Rate</span>
              <span className="text-lg font-semibold" style={{ color: successRateColor }}>
                {successRate !== null ? `${successRate}%` : "-"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Succeeded</span>
              <span className="font-medium" style={{ color: MAIN_COLOR.GREEN }}>{succeeded}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Failed</span>
              <span className="font-medium" style={{ color: failed > 0 ? MAIN_COLOR.RED : undefined }}>
                {failed}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PipelineTypeBreakdown({ metrics, isLoading }: PipelineTypeBreakdownProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pipeline Type Breakdown</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PIPELINE_TYPE_ORDER.map((type) => (
          <PipelineTypeCard key={type} type={type} metrics={metrics[type]} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
}
