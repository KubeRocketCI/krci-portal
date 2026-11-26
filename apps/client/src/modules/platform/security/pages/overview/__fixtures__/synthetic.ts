// SYNTHETIC data: derived from the recording of the testbed, not recorded from it. Only for the states the testbed does
// not hold: a caller who may not list the CodebaseImageStreams, more codebases with findings than "Where to start"
// lists, a managed namespace without a Stage, a codebase tag without a Codebase, a Codebase without a scan, and
// DefectDojo without Runtime or without Code and Image scan data.
import {
  NO_FINDING_COUNTS,
  compareOverviewNamespaces,
  type OverviewCodebase,
  type SecurityOverview,
  type SecurityOverviewCodebases,
  type SeverityCounts,
} from "@my-project/shared";
import { TOP_ROWS } from "../utils/model";
import { recordedCodebases, recordedRuntime } from "./seed";

export const counts = (found: Partial<SeverityCounts>): SeverityCounts => ({ ...NO_FINDING_COUNTS, ...found });

function recordedActiveRuntime() {
  const recorded = recordedRuntime("active");
  if (recorded.state !== "data") {
    throw new Error("The recording of the Active Runtime part holds no data");
  }
  return recorded;
}

function recordedActiveCodebases() {
  const recorded = recordedCodebases("active");
  if (recorded.state !== "data") {
    throw new Error("The recording of the Active Codebases part holds no data");
  }
  return recorded;
}

/** The Runtime part when DefectDojo holds no namespace product. */
export const NO_RUNTIME_SCAN_DATA: { state: "noScanData" } = { state: "noScanData" };

/** The recorded Runtime part with the namespace krci, which no Stage deploys to, managed by the installation. */
export function syntheticManagedRuntime(): SecurityOverview {
  const recorded = recordedActiveRuntime();

  return {
    ...recorded,
    namespaces: recorded.namespaces
      .map((row) => (row.namespace === "krci" ? { ...row, managed: true } : row))
      .sort(compareOverviewNamespaces()),
  };
}

/** The recorded Codebases part for a caller who may not list the CodebaseImageStreams: no scan says whose image. */
export function syntheticCodebasesWithoutImageOwner(): SecurityOverviewCodebases {
  const recorded = recordedActiveCodebases();

  return {
    ...recorded,
    codebases: recorded.codebases.map((entry) => ({
      ...entry,
      scans: entry.scans.map((scan) => ({ ...scan, ownImage: null })),
    })),
  };
}

/** The Codebases part when the tenant has no CI test: every recorded Codebase is without scan data. */
export function syntheticNoScanDataCodebases(): SecurityOverviewCodebases {
  return { state: "noScanData", unscanned: recordedActiveCodebases().codebases.map(({ codebase }) => codebase) };
}

function busyCodebase(position: number): OverviewCodebase {
  const name = `service-${position}`;

  return {
    codebase: name,
    known: true,
    scans: [
      {
        ref: { level: "image", branch: "main", scanner: "Trivy Scan", image: `registry.example.test/krci/${name}` },
        ownImage: true,
        version: "main-20261120-090000",
        date: "2026-11-20T09:00:00Z",
        testUrl: `https://defectdojo.example.test/test/${500 + position}`,
        counts: counts({ Critical: 100 - position, High: 2 }),
      },
    ],
  };
}

/**
 * The recorded codebases and `TOP_ROWS` + 1 more, service-1 and on, whose Critical counts outrank every recorded one
 * and fall with the number: the last of them is past the rows of a list of "Where to start".
 */
export function syntheticBusyCodebases(): SecurityOverviewCodebases {
  const recorded = recordedActiveCodebases();
  const busy = Array.from({ length: TOP_ROWS + 1 }, (_, index) => busyCodebase(index + 1));

  return {
    ...recorded,
    codebases: [...recorded.codebases, ...busy].sort((a, b) => a.codebase.localeCompare(b.codebase)),
  };
}

const DELETED_CODEBASE: OverviewCodebase = {
  codebase: "deleted-app",
  known: false,
  scans: [
    {
      ref: { level: "code", branch: "main", scanner: "Semgrep JSON Report", image: null },
      ownImage: false,
      version: "",
      date: "2026-11-20T10:15:00Z",
      testUrl: "https://defectdojo.example.test/test/230",
      counts: counts({ Critical: 1, Medium: 3 }),
    },
  ],
};

/**
 * The recorded codebases, and deleted-app, a codebase tag without a Codebase, before them as the server orders by name;
 * idle-app is a Codebase without a scan.
 */
export function syntheticUnknownAndUnscannedCodebases(): SecurityOverviewCodebases {
  const recorded = recordedActiveCodebases();

  return { ...recorded, codebases: [DELETED_CODEBASE, ...recorded.codebases], unscanned: ["idle-app"] };
}
