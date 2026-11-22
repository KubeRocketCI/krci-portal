// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Variant B, "Built vs running": the path branch -> image -> Environment on top, then the codebase's
// own image as built and as running, side by side, grouped by component.
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  PrototypeDefectDojoFinding,
  PrototypeDefectDojoSeverityCounts,
  PrototypeDefectDojoTest,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { usePrototypeDefectDojoFindings } from "@/modules/platform/security/prototype-defectdojo/api/hooks";
import { DefectDojoLink } from "@/modules/platform/security/prototype-defectdojo/components/DefectDojoLink";
import { FindingSeverityBadge } from "@/modules/platform/security/prototype-defectdojo/components/FindingBadges";
import { FindingsTable } from "@/modules/platform/security/prototype-defectdojo/components/FindingsTable";
import { PrototypeStatePanel } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeStatePanel";
import { SeverityCounts } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import {
  CleanScanBadge,
  NoScanDataState,
  NotConfiguredState,
  UnreachableState,
} from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import {
  PROTOTYPE_LEVEL_META,
  PROTOTYPE_NO_VALUE,
  PROTOTYPE_SEVERITY_KEYS,
} from "@/modules/platform/security/prototype-defectdojo/constants";
import { formatScanTime } from "@/modules/platform/security/prototype-defectdojo/utils";
import { useCodebaseFindingsModel } from "../hooks/useCodebaseFindingsModel";
import { environmentKey, environmentLabel, isFocusedEnvironment, testCounts, testLabel } from "../model";
import type { CodebaseFindingsModel, CodebaseFindingsVariantProps, LevelModel, ScanTarget } from "../types";

/** Findings read per panel for the grouping. A test with more active findings is cut here. */
const GROUPING_LIMIT = 500;

interface ComponentGroup {
  key: string;
  name: string;
  version: string | null;
  findings: PrototypeDefectDojoFinding[];
  counts: PrototypeDefectDojoSeverityCounts;
  fixVersions: string[];
}

/** Findings grouped by component name and version, in the order of their most severe finding. */
function groupByComponent(findings: PrototypeDefectDojoFinding[]): ComponentGroup[] {
  const groups = new Map<string, ComponentGroup>();

  for (const finding of findings) {
    const name = finding.componentName ?? "No component";
    const key = `${name}@${finding.componentVersion ?? ""}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name,
        version: finding.componentVersion,
        findings: [],
        counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
        fixVersions: [],
      };
      groups.set(key, group);
    }

    group.findings.push(finding);
    group.counts.total += 1;
    const severityKey = PROTOTYPE_SEVERITY_KEYS.find((item) => item.severity === finding.severity)?.key;
    if (severityKey) {
      group.counts[severityKey] += 1;
    }
    if (finding.fixVersion && !group.fixVersions.includes(finding.fixVersion)) {
      group.fixVersions.push(finding.fixVersion);
    }
  }

  // Findings arrive most severe first, so insertion order is severity order.
  return [...groups.values()];
}

/** Active findings of the picked test of a target, grouped by component. */
function usePanelFindings(target: ScanTarget | null, pickedTestId: number | null, model: CodebaseFindingsModel) {
  const tests = target?.tests ?? [];
  const test =
    tests.find((candidate) => candidate.id === pickedTestId) ??
    tests.find((candidate) => (testCounts(model.counts, candidate.id)?.total ?? 0) > 0) ??
    tests[0] ??
    null;

  const query = usePrototypeDefectDojoFindings(test ? { testId: test.id, limit: GROUPING_LIMIT, active: true } : null);

  const groups = React.useMemo(
    () => (query.data?.state === "data" ? groupByComponent(query.data.data.findings) : []),
    [query.data]
  );

  return { test, groups, query };
}

export function VariantB({ scope, focus }: CodebaseFindingsVariantProps) {
  const model = useCodebaseFindingsModel(scope, { withInactive: false });

  const [pickedBranch, setPickedBranch] = React.useState<string | null>(null);
  const [pickedEnvironmentKey, setPickedEnvironmentKey] = React.useState<string | null>(null);
  const [builtTestId, setBuiltTestId] = React.useState<number | null>(null);
  const [runningTestId, setRunningTestId] = React.useState<number | null>(null);

  const branch = pickedBranch ?? scope.branches[0] ?? "";
  const environment =
    scope.environments.find((candidate) => environmentKey(candidate) === pickedEnvironmentKey) ??
    scope.environments.find((candidate) => isFocusedEnvironment(candidate, focus)) ??
    scope.environments[0] ??
    null;

  const codeTargets = model.levels.code.targets.filter((target) => target.branch === branch);
  const imageTargets = model.levels.image.targets.filter((target) => target.branch === branch);
  const builtTarget = imageTargets.find((target) => target.ownImage) ?? null;
  const otherImageTargets = imageTargets.filter((target) => !target.ownImage);

  // A container that is not running has nothing to compare.
  const runtimeTargets = model.levels.runtime.targets.filter(
    (target) =>
      !target.notRunning &&
      environment !== null &&
      target.environment !== null &&
      environmentKey(target.environment) === environmentKey(environment)
  );
  // The container that runs the codebase's own image leads; any other container otherwise.
  const runningTarget = runtimeTargets.find((target) => target.ownImage) ?? runtimeTargets[0] ?? null;

  const built = usePanelFindings(builtTarget, builtTestId, model);
  const running = usePanelFindings(runningTarget, runningTestId, model);

  const builtKeys = React.useMemo(() => new Set(built.groups.map((group) => group.key)), [built.groups]);
  const runningKeys = React.useMemo(() => new Set(running.groups.map((group) => group.key)), [running.groups]);

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const anyUnreachable =
    model.levels.code.state === "unreachable" ||
    model.levels.image.state === "unreachable" ||
    model.levels.runtime.state === "unreachable";

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4" data-testid="path-strip">
        <PathStep title="Branch">
          {scope.branches.length > 0 ? (
            <ToggleButtonGroup
              value={branch}
              aria-label="Branch"
              onChange={(_event, next) => next !== null && setPickedBranch(next)}
            >
              {scope.branches.map((name) => (
                <ToggleButton key={name} value={name}>
                  {name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : (
            <span className="text-muted-foreground text-sm">No branches</span>
          )}
        </PathStep>
        <ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <PathStep title="Image built from the branch">
          <span className="text-sm break-all">
            {builtTarget
              ? `${builtTarget.title}${builtTarget.version && ` : ${builtTarget.version}`}`
              : PROTOTYPE_NO_VALUE}
          </span>
        </PathStep>
        <ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <PathStep title="Environment">
          {scope.environments.length > 0 && environment ? (
            <ToggleButtonGroup
              value={environmentKey(environment)}
              aria-label="Environment"
              onChange={(_event, next) => next !== null && setPickedEnvironmentKey(next)}
            >
              {scope.environments.map((item) => (
                <ToggleButton key={environmentKey(item)} value={environmentKey(item)}>
                  {environmentLabel(item)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : (
            <span className="text-muted-foreground text-sm">Not deployed</span>
          )}
        </PathStep>
      </Card>

      {anyUnreachable && <UnreachableState onRetry={model.retry} />}

      <CodeStrip level={model.levels.code} targets={codeTargets} branch={branch} model={model} />

      {builtTarget && runningTarget && builtTarget.version && runningTarget.version && (
        <div className="flex items-center gap-2 text-sm" data-testid="tag-comparison">
          {builtTarget.version === runningTarget.version ? (
            <>
              <Badge variant="success">Same image tag</Badge>
              <span className="text-muted-foreground">
                The Environment runs the scanned build {builtTarget.version}.
              </span>
            </>
          ) : (
            <>
              <Badge variant="warning">Different image tags</Badge>
              <span className="text-muted-foreground">
                Scanned build {builtTarget.version}, running {runningTarget.version}.
              </span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComparePanel
          heading="Built image"
          level={model.levels.image}
          target={builtTarget}
          noDataHint={imageTargets.length > 0 ? "No Image scan carries an image name of this codebase." : undefined}
          panel={built}
          onPickTest={setBuiltTestId}
          otherKeys={running.test ? runningKeys : null}
          matchLabel="Also running"
          missLabel="Only in the build"
          model={model}
        />
        <ComparePanel
          heading={environment ? `Running in ${environmentLabel(environment)}` : "Running"}
          level={model.levels.runtime}
          target={runningTarget}
          noDataHint={scope.environments.length === 0 ? "The codebase is not deployed to any Environment." : undefined}
          panel={running}
          onPickTest={setRunningTestId}
          otherKeys={built.test ? builtKeys : null}
          matchLabel="Also in the build"
          missLabel="Only running"
          model={model}
        />
      </div>

      {otherImageTargets.length > 0 && (
        <Card className="space-y-2 p-4">
          <h3 className="text-foreground text-sm font-semibold">Other images of the chart</h3>
          {otherImageTargets.map((target) => (
            <div key={target.key} className="space-y-1 rounded border p-2">
              <p className="text-xs font-medium break-all">
                {target.title}
                {target.version && ` : ${target.version}`}
              </p>
              {target.tests.map((test) => (
                <OtherImageScan key={test.id} test={test} model={model} />
              ))}
            </div>
          ))}
        </Card>
      )}

      <PrototypeStatePanel
        state={{
          scope,
          branch,
          environment,
          builtTestId: built.test?.id ?? null,
          runningTestId: running.test?.id ?? null,
        }}
      />
    </div>
  );
}

function PathStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium">{title}</span>
      {children}
    </div>
  );
}

interface CodeStripProps {
  level: LevelModel;
  targets: ScanTarget[];
  branch: string;
  model: CodebaseFindingsModel;
}

function CodeStrip({ level, targets, branch, model }: CodeStripProps) {
  const meta = PROTOTYPE_LEVEL_META.code;
  const Icon = meta.icon;
  const tests = targets.flatMap((target) => target.tests);

  return (
    <Card className="flex flex-wrap items-center gap-4 p-4" data-testid="code-strip">
      <div className="flex items-center gap-2">
        <Icon className="size-4" aria-hidden />
        <h3 className="text-foreground text-sm font-semibold">Code</h3>
        <span className="text-muted-foreground text-xs">Branch {branch}</span>
      </div>
      {level.state === "loading" && <LoadingSpinner size={20} />}
      {level.state !== "loading" && level.state !== "unreachable" && tests.length === 0 && (
        <NoScanDataState level="code" className="flex-1" />
      )}
      {tests.map((test) => {
        const counts = testCounts(model.counts, test.id);
        return (
          <div key={test.id} className="flex items-center gap-2 rounded border px-2 py-1">
            <span className="text-xs font-medium">{testLabel(test)}</span>
            {counts?.total === 0 ? <CleanScanBadge /> : <SeverityCounts counts={counts} />}
            <DefectDojoLink href={test.url} label={`Test ${test.id}`} />
          </div>
        );
      })}
    </Card>
  );
}

interface ComparePanelProps {
  heading: string;
  level: LevelModel;
  target: ScanTarget | null;
  noDataHint?: string;
  panel: ReturnType<typeof usePanelFindings>;
  onPickTest: (testId: number) => void;
  /** Component keys of the other panel. `null`: the other panel has no scan to compare with. */
  otherKeys: Set<string> | null;
  matchLabel: string;
  missLabel: string;
  model: CodebaseFindingsModel;
}

function ComparePanel({
  heading,
  level,
  target,
  noDataHint,
  panel,
  onPickTest,
  otherKeys,
  matchLabel,
  missLabel,
  model,
}: ComparePanelProps) {
  const [view, setView] = React.useState<"active" | "triaged">("active");
  const { test, groups, query } = panel;
  const counts = test ? testCounts(model.counts, test.id) : null;

  return (
    <Card className="space-y-3 p-4" data-testid={`panel-${level.level}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-sm font-semibold">{heading}</h3>
          <p className="text-muted-foreground text-xs break-all">
            {target
              ? `${target.imageName ?? target.title}${target.version && ` : ${target.version}`}`
              : PROTOTYPE_LEVEL_META[level.level].subject}
          </p>
          {target?.workload && (
            <p className="text-muted-foreground text-xs break-all">
              Workload {target.workload}, container {target.container ?? PROTOTYPE_NO_VALUE}
            </p>
          )}
        </div>
        <SeverityCounts counts={counts} />
      </div>

      {level.state === "loading" && (
        <div className="flex justify-center p-4">
          <LoadingSpinner size={24} />
        </div>
      )}
      {level.state !== "loading" && level.state !== "unreachable" && !target && (
        <NoScanDataState level={level.level} hint={noDataHint} />
      )}

      {target && test && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {target.tests.length > 1 && (
              <ToggleButtonGroup
                value={String(test.id)}
                aria-label="Scan"
                onChange={(_event, next) => next !== null && onPickTest(Number(next))}
              >
                {target.tests.map((candidate) => (
                  <ToggleButton key={candidate.id} value={String(candidate.id)}>
                    {testLabel(candidate)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
            <ToggleButtonGroup
              value={view}
              aria-label="Finding state"
              onChange={(_event, next) => next !== null && setView(next)}
            >
              <ToggleButton value="active">Active</ToggleButton>
              <ToggleButton value="triaged">Triaged</ToggleButton>
            </ToggleButtonGroup>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-muted-foreground text-xs">Scanned {formatScanTime(test.updated)}</span>
              <DefectDojoLink href={test.url} label={`Test ${test.id}`}>
                Test
              </DefectDojoLink>
              <DefectDojoLink href={test.product.url} label={`Product ${test.product.name}`}>
                Product
              </DefectDojoLink>
            </div>
          </div>

          {view === "triaged" && (
            <FindingsTable testId={test.id} triaged="only" caption={`Triaged findings of ${testLabel(test)}`} />
          )}

          {view === "active" && query.isLoading && (
            <div className="flex justify-center p-4">
              <LoadingSpinner size={24} />
            </div>
          )}
          {view === "active" && !query.isLoading && query.data?.state !== "data" && (
            <UnreachableState compact what="Findings" onRetry={() => void query.refetch()} />
          )}
          {view === "active" && query.data?.state === "data" && groups.length === 0 && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CleanScanBadge />
              The scan reported no active findings.
            </div>
          )}
          {view === "active" && groups.length > 0 && (
            <ul className="divide-y rounded border" aria-label={`Components with findings, ${heading}`}>
              {groups.map((group) => (
                <li key={group.key}>
                  <ComponentRow group={group} otherKeys={otherKeys} matchLabel={matchLabel} missLabel={missLabel} />
                </li>
              ))}
            </ul>
          )}
          {view === "active" && query.data?.state === "data" && query.data.data.count > GROUPING_LIMIT && (
            <p className="text-muted-foreground text-xs">
              Grouped from the first {GROUPING_LIMIT} of {query.data.data.count} active findings.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

interface ComponentRowProps {
  group: ComponentGroup;
  otherKeys: Set<string> | null;
  matchLabel: string;
  missLabel: string;
}

function ComponentRow({ group, otherKeys, matchLabel, missLabel }: ComponentRowProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="hover:bg-input/50 focus-visible:ring-ring flex w-full flex-wrap items-center gap-2 px-2 py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none">
        {open ? (
          <ChevronDown className="size-4 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1 text-xs break-all">
          <span className="font-medium">{group.name}</span>
          {group.version && <span className="text-muted-foreground"> {group.version}</span>}
        </span>
        {otherKeys && (
          <Badge variant={otherKeys.has(group.key) ? "info" : "neutral"}>
            {otherKeys.has(group.key) ? matchLabel : missLabel}
          </Badge>
        )}
        <SeverityCounts counts={group.counts} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="bg-muted/40 space-y-1 px-8 py-2">
          {group.fixVersions.length > 0 && (
            <li className="text-xs">
              <span className="text-muted-foreground">Fixed in </span>
              {group.fixVersions.join(", ")}
            </li>
          )}
          {group.findings.map((finding) => (
            <li key={finding.id} className="flex items-center gap-2 text-xs">
              <FindingSeverityBadge severity={finding.severity} />
              <span className="min-w-0 flex-1 break-all">{finding.vulnerabilityIds[0] ?? finding.title}</span>
              <DefectDojoLink href={finding.url} label={`Finding ${finding.id}`} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function OtherImageScan({ test, model }: { test: PrototypeDefectDojoTest; model: CodebaseFindingsModel }) {
  const [open, setOpen] = React.useState(false);
  const counts = testCounts(model.counts, test.id);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center gap-2">
        <CollapsibleTrigger
          aria-label={`Findings of ${testLabel(test)}`}
          className="hover:bg-input/50 focus-visible:ring-ring flex items-center gap-2 rounded px-1 py-0.5 text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          {open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
          {testLabel(test)}
        </CollapsibleTrigger>
        {counts?.total === 0 ? <CleanScanBadge /> : <SeverityCounts counts={counts} />}
        <DefectDojoLink href={test.url} label={`Test ${test.id}`} />
      </div>
      <CollapsibleContent className="pt-2">
        {open && <FindingsTable testId={test.id} triaged="hide" caption={`Findings of ${testLabel(test)}`} />}
      </CollapsibleContent>
    </Collapsible>
  );
}
