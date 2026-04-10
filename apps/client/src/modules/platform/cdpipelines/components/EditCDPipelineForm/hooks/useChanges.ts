import React from "react";
import { useStore } from "@tanstack/react-form";
import { useEditCDPipelineForm } from "../providers/form/hooks";
import { useEditCDPipelineData } from "../providers/data/hooks";
import type { EditCDPipelineFormValues } from "../types";
import { buildInitialApplicationBranches } from "../utils/buildInitialApplicationBranches";

type ChangeType = "added" | "removed" | "modified";

export interface ApplicationChange {
  app: string;
  type: ChangeType;
  branch?: string;
  oldBranch?: string;
  newBranch?: string;
}

export interface PromoteChange {
  app: string;
  type: "added" | "removed";
}

export interface DescriptionChange {
  oldDescription: string;
  newDescription: string;
}

export interface CDPipelineChanges {
  descriptionChange: DescriptionChange | null;
  applicationChanges: ApplicationChange[];
  promoteChanges: PromoteChange[];
  hasAnyChanges: boolean;
}

export const useChanges = (): CDPipelineChanges => {
  const form = useEditCDPipelineForm();
  const { cdPipeline } = useEditCDPipelineData();

  const formValues = useStore(form.store, (state: { values: EditCDPipelineFormValues }) => state.values);

  return React.useMemo(() => {
    if (!cdPipeline) {
      return { descriptionChange: null, applicationChanges: [], promoteChanges: [], hasAnyChanges: false };
    }

    const oldDescription = cdPipeline.spec.description ?? "";
    const newDescription = formValues.description ?? "";
    const descriptionChange: DescriptionChange | null =
      oldDescription !== newDescription ? { oldDescription, newDescription } : null;

    const originalApps = cdPipeline.spec.applications || [];
    const originalStreams = cdPipeline.spec.inputDockerStreams || [];
    const currentApps = formValues.applications || [];
    const currentBranches = formValues.inputDockerStreams || [];

    // Build a map of app -> original branch using substring matching.
    // This ensures we compare against the correct original branch values,
    // even when inputDockerStreams is in a different order than applications.
    const originalAppBranches = buildInitialApplicationBranches(originalApps, originalStreams);
    const originalBranchMap = new Map(originalAppBranches.map((item) => [item.appName, item.appBranch]));

    const applicationChanges: ApplicationChange[] = [];

    currentApps.forEach((app, index) => {
      if (!originalApps.includes(app)) {
        applicationChanges.push({ app, type: "added", branch: currentBranches[index] || "" });
      }
    });

    originalApps.forEach((app) => {
      if (!currentApps.includes(app)) {
        const branch = originalBranchMap.get(app) || "";
        applicationChanges.push({ app, type: "removed", branch });
      }
    });

    currentApps.forEach((app, currentIndex) => {
      if (originalApps.includes(app)) {
        const oldBranch = originalBranchMap.get(app) || "";
        const newBranch = currentBranches[currentIndex] || "";
        if (oldBranch !== newBranch) {
          applicationChanges.push({ app, type: "modified", oldBranch, newBranch });
        }
      }
    });

    const originalPromote = new Set(cdPipeline.spec.applicationsToPromote || []);
    const currentPromote = new Set(formValues.applicationsToPromote || []);
    const promoteChanges: PromoteChange[] = [];

    for (const app of currentPromote) {
      if (!originalPromote.has(app)) {
        promoteChanges.push({ app, type: "added" });
      }
    }
    for (const app of originalPromote) {
      if (!currentPromote.has(app)) {
        promoteChanges.push({ app, type: "removed" });
      }
    }

    const hasAnyChanges = descriptionChange !== null || applicationChanges.length > 0 || promoteChanges.length > 0;

    return { descriptionChange, applicationChanges, promoteChanges, hasAnyChanges };
  }, [cdPipeline, formValues]);
};
