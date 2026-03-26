import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQualityGateDetails } from "../../hooks/useQualityGateDetails";
import { ConditionsTable } from "./ConditionsTable";
import { QUALITY_GATE_COLORS } from "../../../sast/constants/colors";
import { cn } from "@/core/utils/classname";

interface QualityGateDetailsProps {
  projectKey: string;
}

function getQualityGateColorClass(status: string): string {
  const statusKey = status as keyof typeof QUALITY_GATE_COLORS;
  return QUALITY_GATE_COLORS[statusKey]?.combined || QUALITY_GATE_COLORS.NONE.combined;
}

export function QualityGateDetails({ projectKey }: QualityGateDetailsProps) {
  const { data, isLoading, error } = useQualityGateDetails(projectKey);

  const status = data?.projectStatus.status;
  const conditions = data?.projectStatus.conditions;

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">Quality Gate Details</h3>
        {status && (
          <Badge variant="outline" className={cn(getQualityGateColorClass(status))}>
            {status}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load quality gate details. Please try again later.</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && data && <ConditionsTable conditions={conditions} />}
    </Card>
  );
}
