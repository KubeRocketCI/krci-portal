import type { SecurityEnvironmentSummary } from "@my-project/shared";
import { useCDPipelineWatch, useCodebasesWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { getOtherCodebases, type OtherCodebases } from "@/modules/platform/security/components/defectdojo/utils";

/** Undefined until the Codebases of the table rows are loaded: without them every codebase would count as other. */
export const useOtherCodebases = (summary: SecurityEnvironmentSummary | undefined): OtherCodebases | undefined => {
  const applications = useCDPipelineWatch().data?.spec.applications;
  const codebaseListWatch = useCodebasesWatch();

  if (!applications || !codebaseListWatch.query.data || codebaseListWatch.query.isPlaceholderData) {
    return undefined;
  }

  // The watch drops its name filter for an empty or very long name list, so keep the pipeline's applications only.
  const rowNames = codebaseListWatch.data.array
    .map((codebase) => codebase.metadata.name)
    .filter((name) => applications.includes(name));

  return getOtherCodebases(summary, rowNames);
};
