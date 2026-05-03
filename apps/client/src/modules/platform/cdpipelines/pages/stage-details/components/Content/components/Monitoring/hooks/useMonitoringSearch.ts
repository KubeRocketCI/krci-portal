import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import type { MetricRange } from "@my-project/shared";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { DEFAULT_AUTO_REFRESH, DEFAULT_RANGE } from "../constants";

interface UseMonitoringSearchResult {
  /** null means "all known apps" (no filter active). */
  apps: string[] | null;
  range: MetricRange;
  autoRefresh: boolean;
  setApps: (next: string[]) => void;
  clearApps: () => void;
  setRange: (next: MetricRange) => void;
  setAutoRefresh: (next: boolean) => void;
  toggleApp: (app: string) => void;
  isolateApp: (app: string) => void;
}

type SearchPatch = Partial<{ apps: string | undefined; range: MetricRange; autoRefresh: boolean }>;

function parseApps(raw: string | undefined): string[] | null {
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 0 ? null : list;
}

function serializeApps(list: string[]): string | undefined {
  return list.length === 0 ? undefined : list.join(",");
}

export function useMonitoringSearch(): UseMonitoringSearchResult {
  const search = routeStageDetails.useSearch();
  const navigate = useNavigate();

  const apps = React.useMemo(() => parseApps(search.apps), [search.apps]);
  const range: MetricRange = search.range ?? DEFAULT_RANGE;
  const autoRefresh = search.autoRefresh ?? DEFAULT_AUTO_REFRESH;

  // `replace: false` (the default) for deliberate navigations the user may want
  // to undo with browser-back; `replace: true` only for the autoRefresh
  // preference toggle which shouldn't pollute history.
  const update = React.useCallback(
    (patch: SearchPatch, replace = false) => {
      void navigate({
        replace,
        search: ((prev: Record<string, unknown>) => ({ ...prev, ...patch })) as never,
      });
    },
    [navigate]
  );

  const setApps = React.useCallback((next: string[]) => update({ apps: serializeApps(next) }), [update]);
  const clearApps = React.useCallback(() => update({ apps: undefined }), [update]);
  const setRange = React.useCallback((next: MetricRange) => update({ range: next }), [update]);
  const setAutoRefresh = React.useCallback((next: boolean) => update({ autoRefresh: next }, true), [update]);

  const toggleApp = React.useCallback(
    (app: string) => {
      const current = apps ?? [];
      const next = current.includes(app) ? current.filter((a) => a !== app) : [...current, app];
      update({ apps: serializeApps(next) });
    },
    [apps, update]
  );

  const isolateApp = React.useCallback(
    (app: string) => {
      const alreadyIsolated = apps?.length === 1 && apps[0] === app;
      update({ apps: alreadyIsolated ? undefined : serializeApps([app]) });
    },
    [apps, update]
  );

  return { apps, range, autoRefresh, setApps, clearApps, setRange, setAutoRefresh, toggleApp, isolateApp };
}
