import {
  DEFECTDOJO_MAX_PAGE_SIZE,
  DEFECTDOJO_SEVERITIES,
  NO_FINDING_COUNTS,
  type CodebaseScan,
  type RuntimeEnvironment,
  type RuntimeLevel,
  type ScanFinding,
  type SeverityCounts,
} from "@my-project/shared";
import type { RunningContainer, SecurityFindingsFocus } from "../../types";
import { isFocusedEnvironment } from "../../utils";

export interface RunningCounterpart {
  environment: RuntimeEnvironment;
  container: RunningContainer;
  /** The running tag equals the built tag. `null`: either tag is empty, so there is no mark. */
  sameTag: boolean | null;
  focused: boolean;
}

/** The focused Environment comes first; the others keep the order the server sent. */
export function pairBuiltWithRunning(
  built: Pick<CodebaseScan, "ref" | "version">,
  runtime: Pick<RuntimeLevel, "environments">,
  focus: SecurityFindingsFocus | null
): RunningCounterpart[] {
  const builtImage = built.ref.image?.toLowerCase();
  if (builtImage === undefined) {
    return [];
  }

  const counterparts = runtime.environments.flatMap((environment) =>
    environment.containers.flatMap((container): RunningCounterpart[] =>
      container.state === "running" && container.image?.toLowerCase() === builtImage
        ? [
            {
              environment,
              container,
              sameTag: built.version === "" || container.version === "" ? null : built.version === container.version,
              focused: isFocusedEnvironment(environment, focus),
            },
          ]
        : []
    )
  );

  return [...counterparts.filter(({ focused }) => focused), ...counterparts.filter(({ focused }) => !focused)];
}

export interface ComponentGroup {
  key: string;
  name: string;
  /** `null`: the scanner names no version. */
  version: string | null;
  counts: SeverityCounts;
  findings: ScanFinding[];
}

export const NO_COMPONENT = "No component";

/**
 * Ordered by the most severe finding, then by the number of findings, then by name; versions of one component keep the
 * order of their first finding.
 */
export function groupByComponent(findings: readonly ScanFinding[]): ComponentGroup[] {
  const groups = new Map<string, ComponentGroup>();

  for (const finding of findings) {
    const key = JSON.stringify([finding.componentName, finding.componentVersion]);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name: finding.componentName ?? NO_COMPONENT,
        version: finding.componentVersion,
        counts: { ...NO_FINDING_COUNTS },
        findings: [],
      };
      groups.set(key, group);
    }
    group.findings.push(finding);
    group.counts[finding.severity] += 1;
  }

  const mostSevere = ({ counts }: ComponentGroup) =>
    DEFECTDOJO_SEVERITIES.findIndex((severity) => counts[severity] > 0);

  return [...groups.values()].sort(
    (a, b) => mostSevere(a) - mostSevere(b) || b.findings.length - a.findings.length || a.name.localeCompare(b.name)
  );
}

export function groupingNote(total: number): string | null {
  return total > DEFECTDOJO_MAX_PAGE_SIZE
    ? `Grouped from the ${DEFECTDOJO_MAX_PAGE_SIZE} most severe of ${total} active findings.`
    : null;
}
