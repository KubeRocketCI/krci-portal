import { useTriggerBindingWatchItem } from "@/k8s/api/groups/Tekton/TriggerBinding";
import { routeTriggerBindingDetails } from "../route";

export const useTriggerBindingWatch = () => {
  const params = routeTriggerBindingDetails.useParams();
  return useTriggerBindingWatchItem({ namespace: params.namespace, name: params.name });
};
