import { useQuery } from "@tanstack/react-query";
import { useQuickLinkWatchList } from "..";
import { getQuickLinkURLsFromList } from "../../utils";

export const useQuickLinkWatchURLs = (namespace: string) => {
  const quickLinkListWatch = useQuickLinkWatchList({
    namespace,
  });

  return useQuery({
    queryKey: ["quickLinksUrlList", quickLinkListWatch.resourceVersion],
    queryFn: () => {
      return {
        quickLinkList: quickLinkListWatch.data.array,
        quickLinkURLs: getQuickLinkURLsFromList(quickLinkListWatch.data.array),
      };
    },
    enabled: quickLinkListWatch.query.isSuccess,
  });
};
