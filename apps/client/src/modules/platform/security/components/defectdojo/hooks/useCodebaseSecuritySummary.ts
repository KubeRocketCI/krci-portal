import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { SECURITY_SUMMARY_QUERY_OPTIONS } from "../utils";
import { useDefectDojoWebUrl } from "./useDefectDojoWebUrl";

/** CI and runtime findings of a codebase. Sends no request while DefectDojo is not configured. */
export function useCodebaseSecuritySummary(codebase: string | undefined) {
  const trpc = useTRPCClient();
  const defectDojoWebUrl = useDefectDojoWebUrl();

  return useQuery({
    queryKey: ["security", "codebaseSummary", codebase],
    queryFn: () => trpc.security.getCodebaseSummary.query({ codebase: codebase! }),
    enabled: !!defectDojoWebUrl && !!codebase,
    ...SECURITY_SUMMARY_QUERY_OPTIONS,
  });
}
