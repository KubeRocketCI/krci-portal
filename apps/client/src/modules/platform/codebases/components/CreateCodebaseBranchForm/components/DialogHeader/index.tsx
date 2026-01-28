import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { DialogTitle } from "@/core/components/ui/dialog";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

interface DialogHeaderProps {
  codebaseName: string;
}

export const DialogHeader = ({ codebaseName }: DialogHeaderProps) => {
  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex gap-4">
        <DialogTitle className="text-xl font-medium">{`Create branch for "${codebaseName}"`}</DialogTitle>
        <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.anchors.ADD_BRANCH.url} />
      </div>
    </div>
  );
};
