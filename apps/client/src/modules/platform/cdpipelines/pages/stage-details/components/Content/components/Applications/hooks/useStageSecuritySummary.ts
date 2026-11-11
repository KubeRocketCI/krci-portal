import { useEnvironmentSecuritySummary } from "@/modules/platform/security/components/defectdojo/hooks/useEnvironmentSecuritySummary";
import { useDefectDojoWebUrl } from "@/modules/platform/security/components/defectdojo/hooks/useDefectDojoWebUrl";
import { useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";

/** One environment summary per Stage, shared by the Security column and the table footer. */
export const useStageSecuritySummary = () => {
  const defectDojoWebUrl = useDefectDojoWebUrl();
  const stage = useStageWatch().query.data;

  const query = useEnvironmentSecuritySummary({
    cdPipeline: stage?.spec.cdPipeline,
    stage: stage?.spec.name,
  });

  return {
    isConfigured: !!defectDojoWebUrl,
    summary: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
