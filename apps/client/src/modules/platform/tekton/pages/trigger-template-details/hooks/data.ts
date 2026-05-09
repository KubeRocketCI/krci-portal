import { useTriggerTemplateWatchItem } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { routeTriggerTemplateDetails } from "../route";

export const useTriggerTemplateWatch = () => {
  const params = routeTriggerTemplateDetails.useParams();
  return useTriggerTemplateWatchItem({ namespace: params.namespace, name: params.name });
};
