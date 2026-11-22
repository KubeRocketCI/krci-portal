// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Variant A, "Level lanes": three lanes (Code, Image, Runtime) for one branch and one Environment.
// A scan picked in a lane fills the findings table under the lanes.
import React from "react";
import type {
  PrototypeDefectDojoLevel,
  PrototypeDefectDojoSeverity,
  PrototypeDefectDojoTest,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { Label } from "@/core/components/ui/label";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Switch } from "@/core/components/ui/switch";
import { cn } from "@/core/utils/classname";
import { DefectDojoLink } from "@/modules/platform/security/prototype-defectdojo/components/DefectDojoLink";
import { FindingsTable } from "@/modules/platform/security/prototype-defectdojo/components/FindingsTable";
import { PrototypeStatePanel } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeStatePanel";
import { SeverityCounts } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import { SeverityFilter } from "@/modules/platform/security/prototype-defectdojo/components/SeverityFilter";
import {
  CleanScanBadge,
  NoScanDataState,
  NotConfiguredState,
  UnreachableState,
} from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import { PROTOTYPE_LEVEL_META } from "@/modules/platform/security/prototype-defectdojo/constants";
import { formatScanTime } from "@/modules/platform/security/prototype-defectdojo/utils";
import { useCodebaseFindingsModel } from "../hooks/useCodebaseFindingsModel";
import { environmentKey, environmentLabel, isFocusedEnvironment, testCounts, testLabel } from "../model";
import type { CodebaseFindingsModel, CodebaseFindingsVariantProps, LevelModel, ScanTarget } from "../types";

const LEVELS: PrototypeDefectDojoLevel[] = ["code", "image", "runtime"];

export function VariantA({ scope, focus }: CodebaseFindingsVariantProps) {
  const model = useCodebaseFindingsModel(scope, { withInactive: true });

  const [pickedBranch, setPickedBranch] = React.useState<string | null>(null);
  const [pickedEnvironmentKey, setPickedEnvironmentKey] = React.useState<string | null>(null);
  const [pickedTestId, setPickedTestId] = React.useState<number | null>(null);
  const [showTriaged, setShowTriaged] = React.useState(false);
  const [severity, setSeverity] = React.useState<PrototypeDefectDojoSeverity | undefined>(undefined);

  const branch = pickedBranch ?? scope.branches[0] ?? "";
  const environment =
    scope.environments.find((candidate) => environmentKey(candidate) === pickedEnvironmentKey) ??
    scope.environments.find((candidate) => isFocusedEnvironment(candidate, focus)) ??
    scope.environments[0] ??
    null;

  const visibleTargets: Record<PrototypeDefectDojoLevel, ScanTarget[]> = {
    code: model.levels.code.targets.filter((target) => target.branch === branch),
    image: model.levels.image.targets.filter((target) => target.branch === branch),
    runtime: model.levels.runtime.targets.filter(
      (target) =>
        environment !== null &&
        target.environment !== null &&
        environmentKey(target.environment) === environmentKey(environment)
    ),
  };

  const visibleTests = LEVELS.flatMap((level) =>
    visibleTargets[level].flatMap((target) => target.tests.map((test) => ({ test, target })))
  );
  // Default selection: the first scan with active findings.
  const selected =
    visibleTests.find((item) => item.test.id === pickedTestId) ??
    visibleTests.find((item) => (testCounts(model.counts, item.test.id)?.total ?? 0) > 0) ??
    null;

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const captions: Record<PrototypeDefectDojoLevel, string> = {
    code: `Branch ${branch}`,
    image: `Branch ${branch}`,
    runtime: environment ? `Environment ${environmentLabel(environment)}` : "No Environment",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="prototype-a-branch">Branch (Code, Image)</Label>
          <Select value={branch} onValueChange={setPickedBranch}>
            <SelectTrigger id="prototype-a-branch" className="w-56">
              <SelectValue placeholder="No branches" />
            </SelectTrigger>
            <SelectContent>
              {scope.branches.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="prototype-a-environment">Environment (Runtime)</Label>
          <Select
            value={environment ? environmentKey(environment) : ""}
            onValueChange={setPickedEnvironmentKey}
            disabled={scope.environments.length === 0}
          >
            <SelectTrigger id="prototype-a-environment" className="w-56">
              <SelectValue placeholder="Not deployed" />
            </SelectTrigger>
            <SelectContent>
              {scope.environments.map((item) => (
                <SelectItem key={environmentKey(item)} value={environmentKey(item)}>
                  {environmentLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {LEVELS.map((level) => (
          <Lane
            key={level}
            level={model.levels[level]}
            targets={visibleTargets[level]}
            caption={captions[level]}
            noDataHint={
              level === "runtime" && scope.environments.length === 0
                ? "The codebase is not deployed to any Environment."
                : undefined
            }
            model={model}
            selectedTestId={selected?.test.id ?? null}
            onSelect={setPickedTestId}
          />
        ))}
      </div>

      <Card className="space-y-3 p-4">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h3 className="text-foreground text-sm font-semibold">{testLabel(selected.test)}</h3>
                <p className="text-muted-foreground text-xs break-all">
                  {PROTOTYPE_LEVEL_META[selected.target.level].label}: {selected.target.title}
                  {selected.target.version && ` : ${selected.target.version}`}
                </p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                <DefectDojoLink href={selected.test.url} label={`Test ${selected.test.id}`}>
                  Test
                </DefectDojoLink>
                <DefectDojoLink
                  href={selected.test.engagement.url}
                  label={`Engagement ${selected.test.engagement.name}`}
                >
                  Engagement
                </DefectDojoLink>
                <DefectDojoLink href={selected.test.product.url} label={`Product ${selected.test.product.name}`}>
                  Product
                </DefectDojoLink>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <SeverityFilter value={severity} onChange={setSeverity} />
              <div className="flex items-center gap-2">
                <Switch id="prototype-a-triaged" checked={showTriaged} onCheckedChange={setShowTriaged} />
                <Label htmlFor="prototype-a-triaged">
                  Show triaged ({model.counts.get(selected.test.id)?.inactiveTotal ?? "—"})
                </Label>
              </div>
            </div>
            <FindingsTable
              testId={selected.test.id}
              triaged={showTriaged ? "show" : "hide"}
              severity={severity}
              caption={`Findings of ${testLabel(selected.test)}`}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Select a scan in a lane to list its findings.</p>
        )}
      </Card>

      <PrototypeStatePanel state={{ scope, branch, environment, selectedTestId: selected?.test.id ?? null }} />
    </div>
  );
}

interface LaneProps {
  level: LevelModel;
  /** Targets of the level for the picked branch or Environment. */
  targets: ScanTarget[];
  caption: string;
  noDataHint?: string;
  model: CodebaseFindingsModel;
  selectedTestId: number | null;
  onSelect: (testId: number) => void;
}

function Lane({ level, targets, caption, noDataHint, model, selectedTestId, onSelect }: LaneProps) {
  const meta = PROTOTYPE_LEVEL_META[level.level];
  const Icon = meta.icon;
  const hasData = level.state === "data" && targets.length > 0;
  const scanCount = targets.reduce((total, target) => total + target.tests.length, 0);

  return (
    <Card className="flex flex-col gap-3 p-4" data-testid={`lane-${level.level}`}>
      <div className="flex items-start gap-3">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-sm font-semibold">{meta.label}</h3>
          <p className="text-muted-foreground text-xs">{caption}</p>
        </div>
      </div>
      {/* No lane total: counts are per scan and two scanners of one target are never added. */}
      {hasData && <p className="text-muted-foreground text-xs">{scanCount} scans, counts per scan</p>}

      {level.state === "loading" && (
        <div className="flex justify-center p-4">
          <LoadingSpinner size={24} />
        </div>
      )}
      {level.state === "unreachable" && (
        <UnreachableState compact what={`${meta.label} findings`} onRetry={model.retry} />
      )}
      {level.state !== "loading" && level.state !== "unreachable" && !hasData && (
        <NoScanDataState level={level.level} hint={noDataHint} />
      )}
      {hasData &&
        targets.map((target) => (
          <div key={target.key} className="space-y-1.5 rounded border p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground min-w-0 text-xs font-medium break-all">{target.title}</span>
              {target.level === "image" && (
                <Badge variant={target.ownImage ? "info" : "neutral"}>
                  {target.ownImage ? "Own image" : "Third-party image"}
                </Badge>
              )}
              {target.notRunning && <Badge variant="neutral">Not running</Badge>}
            </div>
            {(target.version || target.container) && (
              <p className="text-muted-foreground text-xs break-all">
                {target.container && `Container ${target.container}`}
                {target.container && target.version && ", "}
                {target.version && `tag ${target.version}`}
              </p>
            )}
            <ul className="space-y-1">
              {target.tests.map((test) => (
                <li key={test.id}>
                  <ScanRow
                    test={test}
                    model={model}
                    selected={test.id === selectedTestId}
                    onSelect={() => onSelect(test.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </Card>
  );
}

interface ScanRowProps {
  test: PrototypeDefectDojoTest;
  model: CodebaseFindingsModel;
  selected: boolean;
  onSelect: () => void;
}

function ScanRow({ test, model, selected, onSelect }: ScanRowProps) {
  const counts = testCounts(model.counts, test.id);
  const inactiveTotal = model.counts.get(test.id)?.inactiveTotal ?? null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded border px-2 py-1.5",
        selected ? "border-primary bg-primary/5" : "border-transparent"
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="hover:bg-input/50 focus-visible:ring-ring flex min-w-0 flex-1 flex-col items-start gap-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-foreground text-xs font-medium break-all">{testLabel(test)}</span>
        <span className="flex flex-wrap items-center gap-2">
          {counts?.total === 0 ? <CleanScanBadge /> : <SeverityCounts counts={counts} />}
          {inactiveTotal !== null && inactiveTotal > 0 && (
            <span className="text-muted-foreground text-xs">{inactiveTotal} triaged</span>
          )}
        </span>
        <span className="text-muted-foreground text-xs">Scanned {formatScanTime(test.updated)}</span>
      </button>
      <DefectDojoLink href={test.url} label={`Test ${test.id}`} />
    </div>
  );
}
