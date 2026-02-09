import { EmptyList } from "@/core/components/EmptyList";
import { ServerSideTable } from "@/core/components/ServerSideTable";
import { Button } from "@/core/components/ui/button";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { GitFusionPullRequest } from "@my-project/shared";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useCodebaseWatch } from "../../../../hooks/data";
import { TABLE_ID } from "./constants";
import { useColumns } from "./hooks/useColumns";

type PullRequestState = GitFusionPullRequest["state"];

const STATE_TABS: { label: string; value: PullRequestState }[] = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Merged", value: "merged" },
];

const PER_PAGE = 20;

export function PullRequestList() {
  const trpc = useTRPCClient();
  const columns = useColumns();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseGitUrlPath = codebase?.spec.gitUrlPath || "";
  const codebaseGitServer = codebase?.spec.gitServer || "";
  const codebaseRepoName = codebaseGitUrlPath.split("/").at(-1) || "";
  const codebaseOwner = codebaseGitUrlPath.split("/").filter(Boolean).slice(0, -1).join("/");

  const [state, setState] = React.useState<PullRequestState>("open");
  const [page, setPage] = React.useState(0);
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string | number>>(new Set());

  function handleStateChange(newState: PullRequestState): void {
    setState(newState);
    setPage(0);
    setExpandedRowIds(new Set());
  }

  const query = useQuery({
    queryKey: ["pullRequestList", codebaseGitServer, codebaseOwner, codebaseRepoName, state, page],
    queryFn: () =>
      trpc.gitfusion.getPullRequestList.query({
        gitServer: codebaseGitServer,
        owner: codebaseOwner,
        repoName: codebaseRepoName,
        state,
        page: page + 1,
        perPage: PER_PAGE,
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!codebaseGitServer && !!codebaseOwner && !!codebaseRepoName,
  });

  const pullRequests: GitFusionPullRequest[] = query.data?.data || [];
  const totalCount = query.data?.pagination?.total || 0;

  return (
    <ServerSideTable
      id={TABLE_ID}
      data={pullRequests}
      columns={columns}
      isLoading={codebaseWatch.query.isLoading || query.isFetching}
      blockerError={query.error ? (query.error as Error) : undefined}
      emptyListComponent={<EmptyList missingItemName={`${state} pull requests`} />}
      expandable={{
        getRowId: (row) => row.id,
        expandedRowIds,
        onExpandedRowsChange: setExpandedRowIds,
        expandedRowRender: (row) => (
          <div className="space-y-2">
            <span className="text-sm font-medium">Description</span>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {row.description || "No description provided."}
            </p>
          </div>
        ),
      }}
      slots={{
        header: (
          <div className="col-span-12 flex items-center gap-2">
            {STATE_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={state === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleStateChange(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        ),
      }}
      pagination={{
        show: true,
        page,
        rowsPerPage: PER_PAGE,
        totalCount,
        onPageChange: setPage,
        onRowsPerPageChange: () => {
          // Fixed page size, no-op
        },
      }}
      settings={{
        show: true,
      }}
    />
  );
}
