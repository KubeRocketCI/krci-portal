import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { usePipelineRunWatchList } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { TABLE } from "@/core/k8s/constants/tables";
import { PipelineRunList } from "@/modules/platform/pipelineruns/components/PipelineRunList";
import React from "react";

export default function PipelineRunListView() {
  const pipelineRunsWatch = usePipelineRunWatchList();

  const { loadSettings } = useTableSettings(TABLE.GENERAL_PIPELINE_RUN_LIST.id);

  const tableSettings = React.useMemo(() => loadSettings(), [loadSettings]);

  return (
    <PageWrapper>
      <Section
        title="PipelineRuns"
        description={
          <>
            Monitor the progress of overall pipeline runs launched within the platform.{" "}
            <LearnMoreLink url={EDP_USER_GUIDE.PIPELINES.url} />
          </>
        }
      >
        <PipelineRunList
          tableId={TABLE.GENERAL_PIPELINE_RUN_LIST.id}
          tableName={TABLE.GENERAL_PIPELINE_RUN_LIST.name}
          tableSettings={tableSettings}
          pipelineRuns={pipelineRunsWatch.dataArray}
          isLoading={pipelineRunsWatch.isInitialLoading}
          errors={pipelineRunsWatch.query.error ? [pipelineRunsWatch.query.error] : []}
        />
      </Section>
    </PageWrapper>
  );
}
