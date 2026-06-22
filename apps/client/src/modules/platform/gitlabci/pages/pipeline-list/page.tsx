import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Card } from "@/core/components/ui/card";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { ciTool } from "@my-project/shared";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import React from "react";
import { GitLabCIPipelineList } from "@/modules/platform/gitlabci/components/GitLabCIPipelineList";
import { useGitLabCIPipelines } from "@/modules/platform/gitlabci/hooks/useGitLabCIPipelines";

function AllGitLabCIPipelines() {
  const codebaseListWatch = useCodebaseWatchList();

  const gitlabCodebases = React.useMemo(
    () => codebaseListWatch.data.array.filter((codebase) => codebase.spec.ciTool === ciTool.gitlab),
    [codebaseListWatch.data.array]
  );

  const { pipelines, isLoading, errors } = useGitLabCIPipelines({ codebases: gitlabCodebases });

  const isInitialLoading =
    codebaseListWatch.isLoading || (gitlabCodebases.length > 0 && isLoading && pipelines.length === 0);

  const codebaseWatchError = codebaseListWatch.error as Error | undefined;
  const allQueriesFailed = gitlabCodebases.length > 0 && errors.length === gitlabCodebases.length;

  const blockerError: Error | undefined = codebaseWatchError ?? (allQueriesFailed ? errors[0] : undefined);
  const partialErrors: Error[] | undefined = !blockerError && errors.length > 0 ? errors : undefined;

  return (
    <GitLabCIPipelineList
      pipelines={pipelines}
      isLoading={isInitialLoading}
      showCodebaseColumn
      tableId="gitlabci-pipelines-all"
      tableName="All GitLab CI Pipelines"
      blockerError={blockerError}
      errors={partialErrors}
    />
  );
}

export function GitLabCIPipelineListPage() {
  return (
    <PageWrapper breadcrumbs={[{ label: "GitLab CI Pipelines" }]}>
      <PageContentWrapper
        icon={ENTITY_ICON.pipelineRun}
        title="GitLab CI Pipelines"
        description="Monitor GitLab CI pipelines across all components configured to run their CI in GitLab CI."
      >
        <Card className="px-6 pb-6">
          <AllGitLabCIPipelines />
        </Card>
      </PageContentWrapper>
    </PageWrapper>
  );
}
