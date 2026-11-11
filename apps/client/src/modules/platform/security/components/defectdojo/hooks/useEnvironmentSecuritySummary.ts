import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { SECURITY_SUMMARY_QUERY_OPTIONS } from "../utils";
import { useDefectDojoWebUrl } from "./useDefectDojoWebUrl";

interface UseEnvironmentSecuritySummaryOptions {
  cdPipeline: string | undefined;
  /** The Stage's `spec.name`, not the Stage resource name. */
  stage: string | undefined;
}

/** Runtime findings per application of an environment. Sends no request while DefectDojo is not configured. */
export function useEnvironmentSecuritySummary({ cdPipeline, stage }: UseEnvironmentSecuritySummaryOptions) {
  const trpc = useTRPCClient();
  const defectDojoWebUrl = useDefectDojoWebUrl();

  return useQuery({
    queryKey: ["security", "environmentSummary", cdPipeline, stage],
    queryFn: () => trpc.security.getEnvironmentSummary.query({ cdPipeline: cdPipeline!, stage: stage! }),
    enabled: !!defectDojoWebUrl && !!cdPipeline && !!stage,
    ...SECURITY_SUMMARY_QUERY_OPTIONS,
  });
}
