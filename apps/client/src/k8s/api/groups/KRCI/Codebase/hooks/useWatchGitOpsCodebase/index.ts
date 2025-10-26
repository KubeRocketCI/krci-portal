import { codebaseGitOpsSystemType, codebaseLabels, codebaseType } from "@my-project/shared";
import { useCodebaseWatchList } from "..";
import { useQuery } from "@tanstack/react-query";

export const useWatchGitOpsCodebase = (namespace: string) => {
  const systemCodebaseListWatch = useCodebaseWatchList({
    namespace,
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.system,
    },
  });

  return useQuery({
    queryKey: ["gitOpsCodebase", systemCodebaseListWatch.resourceVersion],
    queryFn: () => {
      return systemCodebaseListWatch.data.array.find(
        (el) => el.metadata?.labels?.[codebaseLabels.systemType] === codebaseGitOpsSystemType
      );
    },
  });
};
