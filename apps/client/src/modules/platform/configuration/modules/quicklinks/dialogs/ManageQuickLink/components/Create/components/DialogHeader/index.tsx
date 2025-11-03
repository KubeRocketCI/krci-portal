import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const DialogHeader = () => {
  return (
    <div className="flex items-start justify-between gap-1">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">Create Link</h2>
        <LearnMoreLink url={EDP_USER_GUIDE.OVERVIEW.url} />
      </div>
    </div>
  );
};
