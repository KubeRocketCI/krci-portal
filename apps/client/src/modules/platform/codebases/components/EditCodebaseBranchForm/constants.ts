import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "buildPipeline",
      label: "Build Pipeline",
      description: "The Tekton pipeline that builds this branch. Select from available pipelines in your cluster.",
    },
    {
      fieldName: "reviewPipeline",
      label: "Review Pipeline",
      description:
        "The Tekton pipeline that runs code review checks (linting, static analysis) for merge requests on this branch.",
    },
    {
      fieldName: "securityPipeline",
      label: "Security Pipeline",
      description: "The Tekton pipeline that runs security scans for this branch.",
    },
  ],
};
