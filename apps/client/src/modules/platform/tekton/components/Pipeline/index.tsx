import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PipelineGraphDialog } from "../../dialogs/PipelineGraph";
import { PATH_PIPELINE_DETAILS_FULL } from "../../pages/pipeline-details/route";
import { VectorSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/core/components/ui/button";

export const Pipeline = ({ pipelineName, namespace }: { pipelineName: string; namespace: string }) => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <div className="flex items-center gap-1">
      <Button variant="link" asChild className="p-0">
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
