import { Card } from "@/core/components/ui/card";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { sortByName } from "@/core/utils/sortByName";
import { RUNTIME_WITHOUT_MITIGATED_NOTE } from "@/modules/platform/security/components/defectdojo/constants";
import { NoScanDataState, NotConfiguredState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { CODEBASES_PART, RUNTIME_PART, TOP_CODEBASES_TITLE, TOP_NAMESPACES_TITLE } from "../../constants";
import { useSecurityOverview } from "../../hooks/useSecurityOverview";
import type { OverviewTab, Search } from "../../route";
import type { LinkContext } from "../../utils/links";
import {
  codebasesInView,
  levelsInView,
  namespacesInView,
  topCodebases,
  topNamespaces,
  unscannedInView,
} from "../../utils/model";
import { showsPlaceholder, type Part } from "../../utils/parts";
import { toViewFilters, withFilters } from "../../utils/search";
import { CodebasesTab } from "../CodebasesTab";
import { RuntimeLevelCard, ScanLevelCard } from "../LevelCard";
import { NamespacesTab } from "../NamespacesTab";
import { OverviewFilters } from "../OverviewFilters";
import { PartAlerts, PartPlaceholder } from "../PartState";
import { TopCard, TopCodebases, TopNamespaces } from "../WhereToStart";

export interface SecurityOverviewProps {
  search: Search;
  onSearchChange: (search: Search) => void;
  /** The installation namespace: its Stages, Codebases and tenant tag. */
  namespace: string;
  /** The portal cluster the links open in. */
  clusterName: string;
}

export function SecurityOverview({ search, onSearchChange, namespace, clusterName }: SecurityOverviewProps) {
  const { runtime, codebases } = useSecurityOverview({ namespace, state: search.state ?? "active" });
  const runtimeData = runtime?.data?.state === "data" ? runtime.data : null;
  const codebasesData = codebases.data?.state === "data" ? codebases.data : null;
  const unscannedAll =
    codebases.data?.state === "data" || codebases.data?.state === "noScanData" ? codebases.data.unscanned : [];

  const filters = toViewFilters(search, runtimeData?.defaultClusters ?? []);
  const levels = levelsInView(search.level);
  const namespaceRows = runtimeData ? namespacesInView(runtimeData.namespaces, filters) : [];
  const codebaseRows = codebasesData ? codebasesInView(codebasesData.codebases, filters) : [];
  const unscanned = unscannedInView(unscannedAll, filters);
  const links: LinkContext = { clusterName, namespace, severity: search.severity, state: search.state };

  const filterBlock = (
    <OverviewFilters
      search={search}
      filters={filters}
      levels={levels}
      scope={runtimeData}
      codebases={[...(codebasesData?.codebases.map((entry) => entry.codebase) ?? []), ...unscannedAll].sort(sortByName)}
      onChange={(patch) => onSearchChange(withFilters(search, patch))}
    />
  );

  // Both parts read one DefectDojo: a missing connection shows once for the page.
  if (runtime?.data?.state === "notConfigured" || codebases.data?.state === "notConfigured") {
    return (
      <div className="space-y-4">
        {filterBlock}
        <Card className="p-4">
          <NotConfiguredState />
        </Card>
      </div>
    );
  }

  const runtimePart: Part = {
    what: RUNTIME_PART.what,
    query: runtime,
    unaskedNote: RUNTIME_WITHOUT_MITIGATED_NOTE,
    noScanData: (
      <NoScanDataState {...RUNTIME_PART} hint="DefectDojo holds no namespace product of the configured Product Type." />
    ),
  };
  const codebasesPart: Part = {
    what: CODEBASES_PART.what,
    query: codebases,
    noScanData: <NoScanDataState {...CODEBASES_PART} />,
  };
  const runtimePlaceholder = showsPlaceholder(runtimePart) ? <PartPlaceholder part={runtimePart} /> : null;
  const codebasesPlaceholder = showsPlaceholder(codebasesPart) ? <PartPlaceholder part={codebasesPart} /> : null;
  const showsScans = levels.scanLevels.length > 0;
  const scannedLevels = new Set(
    codebasesData?.codebases.flatMap((codebase) => codebase.scans.map((scan) => scan.ref.level))
  );

  const tabs: (Tab & { id: OverviewTab })[] = [
    ...(levels.runtime
      ? [
          {
            id: "namespaces" as const,
            label: "Namespaces",
            component: runtimePlaceholder ?? <NamespacesTab rows={namespaceRows} links={links} />,
          },
        ]
      : []),
    ...(showsScans
      ? [
          {
            id: "codebases" as const,
            label: "Codebases",
            component: (
              <div className="space-y-3">
                {codebasesPlaceholder}
                {(codebasesData !== null || unscanned.length > 0) && (
                  <CodebasesTab codebases={codebaseRows} unscanned={unscanned} links={links} />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];
  const activeTabIdx = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === search.tab)
  );

  return (
    <div className="space-y-4">
      {filterBlock}
      <PartAlerts parts={[...(levels.runtime ? [runtimePart] : []), ...(showsScans ? [codebasesPart] : [])]} />

      <section aria-label="Findings by level" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {levels.scanLevels.map((level) => (
          <ScanLevelCard
            key={level}
            level={level}
            codebases={codebaseRows}
            levelScanned={scannedLevels.has(level)}
            codebase={filters.codebase}
            links={links}
            placeholder={codebasesPlaceholder}
          />
        ))}
        {levels.runtime && (
          <RuntimeLevelCard
            rows={namespaceRows}
            filters={filters}
            secretsTruncated={runtimeData?.secretsTruncated ?? false}
            links={links}
            placeholder={runtimePlaceholder}
          />
        )}
      </section>

      <section aria-label="Where to start" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {levels.runtime && (
          <TopCard title={TOP_NAMESPACES_TITLE} testId="top-namespaces">
            {runtimePlaceholder ?? <TopNamespaces rows={topNamespaces(namespaceRows, search.severity)} links={links} />}
          </TopCard>
        )}
        {showsScans && (
          <TopCard title={TOP_CODEBASES_TITLE} testId="top-codebases">
            {codebasesPlaceholder ?? (
              <TopCodebases entries={topCodebases(codebaseRows, search.severity)} links={links} />
            )}
          </TopCard>
        )}
      </section>

      <Tabs
        tabs={tabs}
        activeTabIdx={activeTabIdx}
        handleChangeTab={(_event, index) => onSearchChange({ ...search, tab: tabs[index].id })}
      />
    </div>
  );
}
