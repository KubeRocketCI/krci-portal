import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { Codebase, GitFusionPipeline, GitFusionPipelineListResponse, stripLeadingSlash } from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";

/**
 * A GitFusion pipeline plus the Codebase it belongs to — the `/api/v1/pipelines` response
 * has no Codebase notion, so we attach it client-side while fanning out one request per codebase.
 */
export interface GitLabCIPipelineRow extends GitFusionPipeline {
  codebaseName: string;
  namespace: string;
  gitServer: string;
  project: string;
}

interface UseGitLabCIPipelinesParams {
  /** Codebases to fetch pipelines for; callers must pre-filter to ciTool=gitlab. */
  codebases: Codebase[];
  perPage?: number;
  enabled?: boolean;
  /** Poll interval in ms; `false` disables polling. */
  refetchInterval?: number | false;
}

/**
 * Fetches GitLab CI pipelines for the given codebases (one tRPC request each) and merges
 * them into a single list sorted newest-first by `created_at`.
 *
 * **Performance:** fans out one HTTP request per codebase on every poll cycle — practical
 * up to ~30 codebases; beyond that the N×poll load is significant. A server-side aggregate
 * endpoint is planned (v0.7).
 */
export function useGitLabCIPipelines({
  codebases,
  perPage = 20,
  enabled = true,
  refetchInterval = 15_000,
}: UseGitLabCIPipelinesParams) {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  // Jitter the interval so concurrent instances desync their polls and avoid a thundering-herd
  // burst to GitFusion. The offset is computed once per instance (useRef, not useMemo) so it stays
  // stable across re-renders instead of re-randomizing — and resyncing — the shared poll timer.
  const jitterOffsetRef = React.useRef(Math.random() * 5_000);
  const jitteredInterval: number | false =
    refetchInterval === false ? false : refetchInterval + jitterOffsetRef.current;

  // staleTime tracks the base poll interval (not the jittered value) so a focus/mount
  // between polls does not trigger a spurious refetch. Falls back to 0 when polling is
  // disabled so the data is still revalidated on mount.
  const staleTime = typeof refetchInterval === "number" ? refetchInterval : 0;

  // Narrow each codebase to only the fields the rows need, so the query/combine closures don't
  // retain whole Codebase objects (spec/status/labels) for their lifetime.
  const targets = React.useMemo(
    () =>
      codebases.map((codebase) => ({
        codebaseName: codebase.metadata.name,
        namespace: codebase.metadata.namespace,
        gitServer: codebase.spec.gitServer,
        project: stripLeadingSlash(codebase.spec.gitUrlPath),
      })),
    [codebases]
  );

  // Merge every codebase's pipelines into one newest-first list. `combine` runs inside useQueries
  // and is memoized (useCallback), so it recomputes only when the query results change — which is
  // why no separate signature of the (per-render-fresh) `queries` array is needed.
  const combine = React.useCallback(
    (results: UseQueryResult<GitFusionPipelineListResponse>[]) => {
      const rows: GitLabCIPipelineRow[] = [];

      results.forEach((result, index) => {
        const target = targets[index];
        if (!target || !result.data) return;

        for (const pipeline of result.data.data) {
          rows.push({
            ...pipeline,
            codebaseName: target.codebaseName,
            namespace: target.namespace ?? defaultNamespace,
            gitServer: target.gitServer,
            project: target.project,
          });
        }
      });

      rows.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

      return {
        pipelines: rows,
        isLoading: results.length > 0 && results.some((result) => result.isLoading),
        errors: results.map((result) => result.error).filter((error): error is Error => Boolean(error)),
      };
    },
    [targets, defaultNamespace]
  );

  return useQueries({
    queries: targets.map(({ gitServer, project }) => ({
      queryKey: ["gitfusion", "pipelineList", clusterName, defaultNamespace, gitServer, project, perPage],
      queryFn: () =>
        trpc.gitfusion.getPipelineList.query({
          clusterName,
          namespace: defaultNamespace,
          gitServer,
          project,
          perPage,
        }),
      enabled: enabled && !!gitServer && !!project,
      refetchInterval: jitteredInterval,
      staleTime,
    })),
    combine,
  });
}
