import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { DialogTitle } from "@/core/components/ui/dialog";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";

export const DialogHeader = () => {
  const {
    props: { codebase },
  } = useCurrentDialog();

  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <DialogTitle className="text-xl font-medium">{`Create branch for "${codebase?.metadata.name}"`}</DialogTitle>
        <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.anchors.ADD_BRANCH.url} />
      </div>
    </div>
  );
};
