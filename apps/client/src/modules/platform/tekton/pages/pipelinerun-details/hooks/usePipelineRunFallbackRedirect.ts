import { useTRPCClient } from "@/core/providers/trpc";
import { RequestError } from "@/core/types/global";
import { useClusterStore } from "@/k8s/store";
import { parseRecordName } from "@my-project/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { buildPipelineRunNameFilter } from "../../../utils/celFilters";
import { PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL } from "../../tekton-result-details/route";
import { routePipelineRunDetails } from "../route";

/**
 * Detect K8s 404 from a tRPC error.
 *
 * The K8sApiError `instanceof` check can fail across monorepo package boundaries,
 * causing handleK8sError to wrap the 404 as INTERNAL_SERVER_ERROR (httpStatus 500).
 * We check multiple signals to reliably detect a K8s "not found".
 */
function isK8sNotFound(error: RequestError | null): boolean {
  if (!error) return false;
  if (error.data?.httpStatus === 404) return true;
  if (error.data?.code === "NOT_FOUND") return true;
  // Fallback: K8sApiError message format is "Kubernetes API request failed: 404 Not Found. ..."
  return error.message?.includes("404 Not Found") === true;
}

/**
 * When a live PipelineRun is not found (404), looks it up in Tekton Results
 * by name and redirects to the historical view.
 *
 * State machine: idle → (K8s 404) → searching → settled
 * Once settled, the hook never re-triggers (prevents redirect loops).
 */
export const usePipelineRunFallbackRedirect = (k8sError: RequestError | null, isK8sLoading: boolean) => {
  const trpc = useTRPCClient();
  const router = useRouter();
  const params = routePipelineRunDetails.useParams();
  const [settled, setSettled] = useState(false);
  const redirectedRef = useRef(false);

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((s) => ({ clusterName: s.clusterName, defaultNamespace: s.defaultNamespace }))
  );

  const isNotFound = !isK8sLoading && isK8sNotFound(k8sError);

  const query = useQuery({
    queryKey: ["tektonResults", "fallback", clusterName, params.namespace, params.name],
    queryFn: () =>
      trpc.tektonResults.listResults.query({
        namespace: params.namespace,
        filter: buildPipelineRunNameFilter(params.name),
        pageSize: 5,
        orderBy: "create_time desc",
      }),
    enabled: isNotFound && !settled,
    retry: false,
    staleTime: Infinity,
  });

  // Settle on any terminal state (success or error) — runs exactly once
  useEffect(() => {
    if (settled || !(query.isSuccess || query.isError)) return;
    setSettled(true);

    const recordInfo = query.data?.results?.[0]?.summary?.record
      ? parseRecordName(query.data.results[0].summary.record)
      : null;
    if (!recordInfo) return;

    redirectedRef.current = true;
    router.navigate({
      to: PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL,
      params: {
        clusterName,
        namespace: params.namespace || defaultNamespace,
        resultUid: recordInfo.resultUid,
        recordUid: recordInfo.recordUid,
      },
      replace: true,
    });
  }, [settled, query.isSuccess, query.isError, query.data, clusterName, defaultNamespace, params.namespace, router]);

  return {
    /** True while looking up history or navigating (shows spinner) */
    isRedirecting: isNotFound && !settled,
    /** True when not found in K8s AND not found in Tekton Results */
    notFoundAnywhere: isNotFound && settled && !redirectedRef.current,
  };
};
