import { useTriggerTemplateWatchItem } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { Skeleton } from "@/core/components/ui/skeleton";
import { PipelinePreview } from "../PipelinePreview";

interface TriggerTemplatePipelinePreviewProps {
  triggerTemplateName: string;
  namespace: string;
  clusterName: string;
}

export const TriggerTemplatePipelinePreview = ({
  triggerTemplateName,
  namespace,
  clusterName,
}: TriggerTemplatePipelinePreviewProps) => {
  const ttWatch = useTriggerTemplateWatchItem({
    name: triggerTemplateName,
    namespace,
  });

  const resolvedPipelineName = ttWatch.query.data?.spec?.resourcetemplates?.[0]?.spec?.pipelineRef?.name as
    | string
    | undefined;

  if (ttWatch.query.isPending) {
    return <Skeleton className="h-5 w-32" />;
  }

  return (
    <PipelinePreview
      pipelineName={resolvedPipelineName ?? triggerTemplateName}
      namespace={namespace}
      clusterName={clusterName}
    />
  );
};
