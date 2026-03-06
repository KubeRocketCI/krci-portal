import { Stage } from "@my-project/shared";
import { PipelineEnvironmentCard } from "../PipelineEnvironmentCard";
import { HorizontalFlowConnector } from "../HorizontalFlowConnector";

interface HorizontalEnvironmentFlowProps {
  stages: Stage[];
  selectedEnvironment: string | null;
}

export function HorizontalEnvironmentFlow({ stages, selectedEnvironment }: HorizontalEnvironmentFlowProps) {
  if (stages.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto pb-2" data-tour="deployment-env-flow">
      <div className="flex items-stretch gap-0">
        {stages.map((stage, index) => {
          const isSelected = stage.spec.name === selectedEnvironment;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.metadata.name} className="flex items-center">
              <PipelineEnvironmentCard stage={stage} isSelected={isSelected} />
              {!isLast && <HorizontalFlowConnector triggerType={stage.spec.triggerType} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
