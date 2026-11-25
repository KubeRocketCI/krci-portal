import type { RuntimeEnvironment } from "@my-project/shared";
import { environmentLabel } from "@/modules/platform/security/components/defectdojo/utils";

export interface EnvironmentCellProps {
  environment: Pick<RuntimeEnvironment, "cdPipeline" | "stage" | "clusterName" | "namespace">;
}

export function EnvironmentCell({ environment }: EnvironmentCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-xs">
      <span className="font-medium break-words">{environmentLabel(environment)}</span>
      <span className="text-muted-foreground break-words">
        {environment.clusterName} / {environment.namespace}
      </span>
    </div>
  );
}
