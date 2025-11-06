import { DialogTitle } from "@/core/components/ui/dialog";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const DialogHeader = () => {
  const {
    props: { stage },
  } = useCurrentDialog();

  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <DialogTitle className="text-xl font-medium">{`Edit ${stage?.metadata.name}`}</DialogTitle>
        <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.anchors.EDIT_STAGE.url} />
      </div>
    </div>
  );
};
