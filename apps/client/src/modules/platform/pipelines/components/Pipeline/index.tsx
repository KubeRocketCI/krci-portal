import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { Stack, IconButton } from "@mui/material";
import { PipelineGraphDialog } from "../../dialogs/PipelineGraph";
import { routePipelineDetails } from "../../pages/details/route";
import { VectorSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/core/components/ui/button";

export const Pipeline = ({ pipelineName, namespace }: { pipelineName: string; namespace: string }) => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <Stack spacing={1} alignItems="center" direction="row">
      <Button variant="link" asChild className="p-0">
        <Link
          to={routePipelineDetails.to}
          params={{
            clusterName,
            name: pipelineName,
            namespace,
          }}
        >
          {pipelineName}
        </Link>
      </Button>

      <IconButton
        onClick={() =>
          openPipelineGraphDialog({
            pipelineName,
            namespace,
          })
        }
        size={"small"}
      >
        <VectorSquare size={16} />
      </IconButton>
    </Stack>
  );
};
