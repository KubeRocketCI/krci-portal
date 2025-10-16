import React from "react";
import { CurrentDialogContext } from "./context";
import { CurrentDialogContextProviderProps } from "./types";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, codebaseType } from "@my-project/shared";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const CurrentDialogContextProvider: React.FC<CurrentDialogContextProviderProps> = ({
  children,
  props,
  state,
}) => {
  const applicationListWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
  });

  // Memoize applications array to prevent infinite loop
  const applications = React.useMemo(() => applicationListWatch.dataArray, [applicationListWatch.dataArray]);

  const CurrentDialogContextValue = React.useMemo(
    () => ({
      props,
      state,
      extra: {
        applications,
      },
    }),
    [applications, props, state]
  );

  return (
    <CurrentDialogContext.Provider value={CurrentDialogContextValue}>
      <LoadingWrapper isLoading={applicationListWatch.query.isLoading}>{children}</LoadingWrapper>
    </CurrentDialogContext.Provider>
  );
};
