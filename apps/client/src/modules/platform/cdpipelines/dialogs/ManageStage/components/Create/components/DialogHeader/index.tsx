import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const DialogHeader = () => {
  const {
    props: { cdPipeline },
  } = useCurrentDialog();

  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">{`Create Environment for "${cdPipeline?.metadata.name}"`} </h2>
        <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.anchors.ADD_STAGE.url} />
      </div>
    </div>
  );
};
