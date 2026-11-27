import {
  DEFECTDOJO_SEVERITIES,
  mostSevereScan,
  type CodebaseScanLevel,
  type CodebaseSecurityLine,
  type DefectDojoSeverity,
  type RuntimeReportKind,
  type SecurityLineRuntime,
  type SecurityLineScanLevel,
  type SeverityCounts,
  type StageRef,
} from "@my-project/shared";
import { outageOf } from "../../../clients/defectDojo/index.js";
import { countActive, countAll, readEnvironmentContainers, readScans, type EnvironmentContainers } from "./compose.js";
import type { CodebaseFacts } from "./facts.js";
import { runtimeReportTests } from "./runtime.js";
import { ciTestTags } from "./scans.js";
import type { CodebaseFindingsSource } from "./source.js";

type ActiveCountOf = ReadonlyMap<number, SeverityCounts | null>;

/** The candidate with the most severe counts; a candidate the client had no data for is none. */
function mostSevereCounted<T extends { testId: number }>(candidates: readonly T[], countOf: ActiveCountOf) {
  return mostSevereScan(
    candidates.flatMap((candidate) => {
      const counts = countOf.get(candidate.testId);
      return counts ? [{ ...candidate, counts }] : [];
    })
  );
}

function mostSevereFinding(counts: SeverityCounts): { severity: DefectDojoSeverity; count: number } | null {
  const severity = DEFECTDOJO_SEVERITIES.find((candidate) => counts[candidate] > 0);
  return severity ? { severity, count: counts[severity] } : null;
}

function levelOf<T extends { testId: number }, D extends object>(
  candidates: readonly T[],
  countOf: ActiveCountOf,
  detail: (worst: T) => D
) {
  const worst = mostSevereCounted(candidates, countOf);
  if (worst === undefined) {
    return { state: "noScanData" } as const;
  }

  const finding = mostSevereFinding(worst.counts);
  return finding ? { state: "data" as const, ...finding, ...detail(worst) } : ({ state: "clean" } as const);
}

interface RuntimeReport {
  testId: number;
  reportKind: RuntimeReportKind;
  environment: StageRef;
}

/** The open reports of the running containers, the Environments in their order. */
function runtimeReports(environmentContainers: readonly EnvironmentContainers[]): RuntimeReport[] {
  return environmentContainers.flatMap(({ environment: { cdPipeline, stage }, containers }) => {
    const environment = { cdPipeline, stage };
    return containers.flatMap(runtimeReportTests).map((report) => ({ ...report, environment }));
  });
}

function runtimeLevel(
  hasContainers: boolean,
  reports: readonly RuntimeReport[],
  countOf: ActiveCountOf
): SecurityLineRuntime {
  if (!hasContainers) {
    return { state: "noScanData" };
  }
  if (reports.length === 0) {
    return { state: "notRunning" };
  }
  return levelOf(reports, countOf, ({ reportKind, environment }) => ({ reportKind, environment }));
}

/**
 * The security line of a codebase: per level the one scan with the most severe active finding, Code and Image on the
 * default branch. Any failed read makes the whole line unreachable or not configured: no partial data.
 */
export async function composeCodebaseSecurityLine(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts
): Promise<CodebaseSecurityLine> {
  try {
    const { defaultBranch } = facts;
    const [scans, environmentContainers] = await Promise.all([
      defaultBranch === null ? [] : readScans(source, facts, { tags: ciTestTags(facts), branchTag: defaultBranch }),
      readEnvironmentContainers(source, facts),
    ]);
    const reports = runtimeReports(environmentContainers);
    const countOf = await countAll([...scans, ...reports], ({ testId }) => countActive(source, testId));
    const scanLevelOf = (level: CodebaseScanLevel): SecurityLineScanLevel =>
      levelOf(
        scans.filter((scan) => scan.ref.level === level),
        countOf,
        (scan) => ({ scanner: scan.ref.scanner })
      );

    return {
      state: "data",
      levels: {
        code: scanLevelOf("code"),
        image: scanLevelOf("image"),
        runtime: runtimeLevel(
          environmentContainers.some(({ containers }) => containers.length > 0),
          reports,
          countOf
        ),
      },
    };
  } catch (error) {
    return outageOf(error);
  }
}
