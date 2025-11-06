import { DialogTitle } from "@/core/components/ui/dialog";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const DialogHeader = () => {
  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <DialogTitle className="text-xl font-medium">Create Deployment Flow</DialogTitle>
        <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_CREATE.anchors.CREATE_VIA_UI.url} />
      </div>
    </div>
  );
};
