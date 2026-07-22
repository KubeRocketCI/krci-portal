import React from "react";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { findOnboardedProject, getRepoMembershipKey } from "../utils";

/**
 * Checks whether a repository path is already onboarded as another project.
 * `membershipKey` is content-stable, so revalidation effects keyed on it ignore
 * watch events that don't change the (name, gitUrlPath) membership.
 */
export const useOnboardedRepoCheck = () => {
  const codebaseListWatch = useCodebaseWatchList();
  const codebases = codebaseListWatch.data.array ?? [];

  const membershipKey = React.useMemo(
    () => getRepoMembershipKey(codebaseListWatch.data.array ?? []),
    [codebaseListWatch.data.array]
  );

  return {
    findOnboardedProject: (candidatePath: string) => findOnboardedProject(codebases, candidatePath),
    membershipKey,
  };
};
