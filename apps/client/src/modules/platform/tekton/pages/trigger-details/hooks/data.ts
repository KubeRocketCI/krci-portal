import { useTriggerWatchItem } from "@/k8s/api/groups/Tekton/Trigger";
import { routeTriggerDetails } from "../route";

export const useTriggerWatch = () => {
  const params = routeTriggerDetails.useParams();
  return useTriggerWatchItem({ namespace: params.namespace, name: params.name });
};
