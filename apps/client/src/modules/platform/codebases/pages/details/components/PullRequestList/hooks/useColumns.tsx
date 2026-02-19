import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { GitFusionPullRequest } from "@my-project/shared";
import { TABLE_ID } from "../constants";

import type { BadgeProps } from "@/core/components/ui/badge";

const STATE_BADGE_VARIANT: Record<GitFusionPullRequest["state"], BadgeProps["variant"]> = {
  open: "success",
  closed: "error",
  merged: "info",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function useColumns(): TableColumn<GitFusionPullRequest>[] {
  const { loadSettings } = useTableSettings(TABLE_ID);
  const tableSettings = loadSettings();

  return useMemo(
    () => [
      {
        id: "number",
        label: "#",
        data: {
          columnSortableValuePath: "number",
          render: ({ data }) => (
            <Button variant="link" asChild className="h-auto p-0 font-mono text-sm font-medium">
              <a href={data.url} target="_blank" rel="noopener noreferrer" aria-label={`Open PR #${data.number}`}>
                {data.number}
              </a>
            </Button>
          ),
        },
        cell: {
          isFixed: true,
          baseWidth: 6,
          ...getSyncedColumnData(tableSettings, "number"),
        },
      },
      {
        id: "title",
        label: "Title",
        data: {
          columnSortableValuePath: "title",
          render: ({ data }) => (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{data.title}</span>
                {data.draft && (
                  <Badge variant="outline" className="text-xs">
                    Draft
                  </Badge>
                )}
              </div>
              {data.author && <span className="text-muted-foreground text-xs">by {data.author.name}</span>}
            </div>
          ),
        },
        cell: {
          isFixed: true,
          baseWidth: 40,
          ...getSyncedColumnData(tableSettings, "title"),
        },
      },
      {
        id: "state",
        label: "State",
        data: {
          columnSortableValuePath: "state",
          render: ({ data }) => <Badge variant={STATE_BADGE_VARIANT[data.state]}>{data.state}</Badge>,
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "state"),
        },
      },
      {
        id: "branches",
        label: "Branches",
        data: {
          render: ({ data }) => (
            <span className="text-muted-foreground text-xs">
              {data.source_branch}
              <span className="mx-1">&rarr;</span>
              {data.target_branch}
              {data.commit_sha && <span className="ml-1 font-mono">({data.commit_sha.slice(0, 7)})</span>}
            </span>
          ),
        },
        cell: {
          baseWidth: 30,
          ...getSyncedColumnData(tableSettings, "branches"),
        },
      },
      {
        id: "updated",
        label: "Updated",
        data: {
          columnSortableValuePath: "updated_at",
          render: ({ data }) => <span className="text-muted-foreground text-sm">{formatDate(data.updated_at)}</span>,
        },
        cell: {
          baseWidth: 14,
          ...getSyncedColumnData(tableSettings, "updated"),
        },
      },
    ],
    [tableSettings]
  );
}
