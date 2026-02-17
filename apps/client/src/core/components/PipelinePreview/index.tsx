import { Button } from "@/core/components/ui/button";
import { PATH_PIPELINE_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { Link } from "@tanstack/react-router";
import { VectorSquare } from "lucide-react";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";

interface PipelinePreviewProps {
  pipelineName: string;
  namespace: string;
  clusterName: string;
}

export const PipelinePreview = ({ pipelineName, namespace, clusterName }: PipelinePreviewProps) => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);

  return (
    <div className="flex items-center gap-1">
      <Button variant="link" asChild className="h-auto p-0">
        <Link
          to={PATH_PIPELINE_DETAILS_FULL}
          params={{
            clusterName,
            name: pipelineName,
            namespace,
          }}
        >
          {pipelineName}
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          openPipelineGraphDialog({
            pipelineName,
            namespace,
          })
        }
      >
        <VectorSquare size={16} />
      </Button>
    </div>
  );
};
