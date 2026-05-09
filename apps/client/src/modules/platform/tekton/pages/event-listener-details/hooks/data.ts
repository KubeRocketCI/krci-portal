import { useEventListenerTopology } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { routeEventListenerDetails } from "../route";

export const useEventListenerDetailsData = () => {
  const { name, namespace } = routeEventListenerDetails.useParams();
  const topology = useEventListenerTopology({ name, namespace });
  return { topology, params: { name, namespace } };
};
