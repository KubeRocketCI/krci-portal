import React from "react";
import { useStore } from "@tanstack/react-form";
import { useEditCDPipelineForm } from "../providers/form/hooks";
import { useEditCDPipelineData } from "../providers/data/hooks";
import type { EditCDPipelineFormValues } from "../types";

export const useHasChanges = (): boolean => {
  const form = useEditCDPipelineForm();
  const { cdPipeline } = useEditCDPipelineData();

  const formValues = useStore(form.store, (state: { values: EditCDPipelineFormValues }) => state.values);

  return React.useMemo(() => {
    if (!cdPipeline) return false;

    // Check description change
    const descriptionChanged = (cdPipeline.spec.description ?? "") !== (formValues.description ?? "");
    if (descriptionChanged) return true;

    // Check applications added/removed
    const originalApps = new Set(cdPipeline.spec.applications || []);
    const currentApps = new Set(formValues.applications || []);
    if (originalApps.size !== currentApps.size) return true;
    for (const app of currentApps) {
      if (!originalApps.has(app)) return true;
    }
    for (const app of originalApps) {
      if (!currentApps.has(app)) return true;
    }

    // Check branch changes (name-correlated, not positional — matches Review component logic)
    const originalAppsArr = cdPipeline.spec.applications || [];
    const currentAppsArr = formValues.applications || [];
    const originalBranches = cdPipeline.spec.inputDockerStreams || [];
    const currentBranches = formValues.inputDockerStreams || [];
    const branchesChanged = currentAppsArr.some((app) => {
      const currentIndex = currentAppsArr.indexOf(app);
      const originalIndex = originalAppsArr.indexOf(app);
      if (originalIndex === -1) return false; // new app, handled by added check
      const oldBranch = originalBranches[originalIndex] ?? "";
      const newBranch = currentBranches[currentIndex] ?? "";
      return oldBranch !== newBranch;
    });
    if (branchesChanged) return true;

    // Check applicationsToPromote changes
    const originalPromote = new Set(cdPipeline.spec.applicationsToPromote || []);
    const currentPromote = new Set(formValues.applicationsToPromote || []);
    if (originalPromote.size !== currentPromote.size) return true;
    for (const app of currentPromote) {
      if (!originalPromote.has(app)) return true;
    }

    return false;
  }, [cdPipeline, formValues]);
};
