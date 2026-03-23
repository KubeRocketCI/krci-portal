import React from "react";
import { Stage } from "@my-project/shared";
import { Skeleton } from "@/core/components/ui/skeleton";
import { PipelineEnvironmentCard } from "../PipelineEnvironmentCard";
import { HorizontalFlowConnector } from "../HorizontalFlowConnector";

const SKELETON_CARD_COUNT = 4;

function EnvironmentCardSkeleton() {
  return (
    <div
      className="border-border bg-card relative flex h-auto w-52 flex-shrink-0 flex-col items-start rounded-2xl border-2 p-4"
      aria-hidden
    >
      <div className="absolute top-5 right-5">
        <Skeleton className="size-2.5 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-xl" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-2 space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[85%]" />
      </div>
      <div className="border-border mt-3 flex w-full border-t pt-3">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

function FlowConnectorSkeleton({ isFirst = false }: { isFirst?: boolean }) {
  return (
    <div className="flex flex-shrink-0 items-center px-2">
      <div className="flex items-center gap-1">
        {!isFirst && <Skeleton className="h-px w-6" />}
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-px w-2" />
        <Skeleton className="size-4 rounded" />
      </div>
    </div>
  );
}

interface HorizontalEnvironmentFlowProps {
  stages: Stage[];
  selectedEnvironment: string | null;
  isLoading?: boolean;
}

export function HorizontalEnvironmentFlow({
  stages,
  selectedEnvironment,
  isLoading = false,
}: HorizontalEnvironmentFlowProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto pb-2" data-tour="deployment-env-flow">
        <div className="flex items-stretch gap-0">
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
            <React.Fragment key={`skeleton-${index}`}>
              <FlowConnectorSkeleton isFirst={index === 0} />
              <div className="relative flex items-center">
                <EnvironmentCardSkeleton />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (stages.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto pb-2" data-tour="deployment-env-flow">
      <div className="flex items-stretch gap-0">
        {stages.map((stage, index) => {
          const isSelected = stage.spec.name === selectedEnvironment;
          const isFirst = index === 0;

          return (
            <div key={stage.metadata.name} className="flex items-center">
              <HorizontalFlowConnector triggerType={stage.spec.triggerType} isFirst={isFirst} />
              <PipelineEnvironmentCard stage={stage} isSelected={isSelected} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
