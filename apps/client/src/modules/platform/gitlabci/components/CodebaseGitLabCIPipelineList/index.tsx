import { Card } from "@/core/components/ui/card";
import { Codebase } from "@my-project/shared";
import React from "react";
import { GitLabCIPipelineList } from "@/modules/platform/gitlabci/components/GitLabCIPipelineList";
import { useGitLabCIPipelines } from "@/modules/platform/gitlabci/hooks/useGitLabCIPipelines";

export function CodebaseGitLabCIPipelineList({ codebase }: { codebase: Codebase }) {
  const codebases = React.useMemo(() => [codebase], [codebase]);
  const { pipelines, isLoading, errors } = useGitLabCIPipelines({ codebases });

  // Surface the first fetch error as a blocker so failures show an error state, not an empty table.
  const blockerError = errors[0];

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipelines</h3>
      <GitLabCIPipelineList
        pipelines={pipelines}
        isLoading={isLoading}
        showCodebaseColumn={false}
        tableId={`gitlabci-pipelines-${codebase.metadata.name}`}
        tableName={`${codebase.metadata.name} GitLab CI Pipelines`}
        blockerError={blockerError}
      />
    </Card>
  );
}
