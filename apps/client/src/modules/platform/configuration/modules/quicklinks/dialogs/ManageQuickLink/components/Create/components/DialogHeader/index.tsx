import { DialogTitle } from "@/core/components/ui/dialog";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const DialogHeader = () => {
  return (
    <div className="flex items-start justify-between gap-1">
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-xl font-medium">Create Link</DialogTitle>
        <LearnMoreLink url={EDP_USER_GUIDE.OVERVIEW.url} />
      </div>
    </div>
  );
};
