import React from "react";
import { Info, FileCode } from "lucide-react";
import { router } from "@/core/router";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";

export const detailTabIds = { overview: "overview", yaml: "yaml" } as const;
export type DetailTabId = (typeof detailTabIds)[keyof typeof detailTabIds];

interface RouteWithParams {
  useParams: () => Record<string, string>;
}

export interface UseDetailTabsArgs {
  route: RouteWithParams;
  path: string;
  Overview: React.ComponentType;
  UsedBy?: React.ComponentType;
  ViewYaml: React.ComponentType;
}

export const useDetailTabs = ({ route, path, Overview, UsedBy, ViewYaml }: UseDetailTabsArgs): Tab[] => {
  const params = route.useParams();
  // TanStack Router's useParams returns a fresh object identity each render
  // even when values are unchanged. Read via a ref keyed on a value-derived
  // string so the callback (and the memoized tabs array below) only rebuild
  // when the params actually change.
  const paramsRef = React.useRef(params);
  paramsRef.current = params;
  const paramsKey = JSON.stringify(params);

  const handleTabNavigate = React.useCallback(
    (tab: DetailTabId) => {
      router.navigate({ to: path, params: paramsRef.current, search: (prev) => ({ ...prev, tab }) });
    },
    // paramsKey is intentional: it is a value-derived stabilization key for
    // the ref-based read above. The linter can't see that we never read
    // `params` directly here, only through `paramsRef.current`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramsKey, path]
  );

  return React.useMemo(
    () => [
      {
        id: detailTabIds.overview,
        label: "Overview",
        icon: <Info className="size-4" />,
        onClick: () => handleTabNavigate(detailTabIds.overview),
        component: (
          <div className="flex flex-col gap-6 pt-6">
            <Overview />
            {UsedBy ? <UsedBy /> : null}
          </div>
        ),
      },
      {
        id: detailTabIds.yaml,
        label: "View YAML",
        icon: <FileCode className="size-4" />,
        onClick: () => handleTabNavigate(detailTabIds.yaml),
        component: (
          <div className="h-full overflow-hidden pt-6">
            <ViewYaml />
          </div>
        ),
      },
    ],
    [handleTabNavigate, Overview, UsedBy, ViewYaml]
  );
};
