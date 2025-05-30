import { useParams } from "@tanstack/react-router";
import { routeComponentDetails } from "../route";

export const usePageParams = () => {
  return useParams({
    from: routeComponentDetails.id,
  });
};
