// SYNTHETIC data: derived from the recording of the testbed (demo / dev), not recorded from it. Only for states the
// testbed does not hold.
import {
  NO_FINDING_COUNTS,
  TRIAGED_RUNTIME_SCAN_LIMIT,
  environmentSummarySchema,
  isRunningEnvironmentContainer,
  type EnvironmentSummaryData,
} from "@my-project/shared";
import { recorded, type Answer } from "./seed";

function present<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`The recording of demo / dev has no ${what}`);
  }
  return value;
}

const DEV = recorded("demo/dev");
const DEV_SUMMARY = present(DEV.summary.state === "data" ? DEV.summary : null, "data");
const DEV_RUNTIME = present(DEV_SUMMARY.runtime.state === "data" ? DEV_SUMMARY.runtime : null, "runtime data");
const APPLICATION = present(DEV_SUMMARY.applications?.[0], "Application");
/** test-go-app, the only running container of the Application. */
const RUNNING = present(APPLICATION.containers.find(isRunningEnvironmentContainer), "running container");
/** worker: every test closed. */
const STOPPED = present(
  APPLICATION.containers.find((container) => !isRunningEnvironmentContainer(container)),
  "container that no longer runs"
);

function derived(overrides: Partial<EnvironmentSummaryData>): Answer {
  return { input: DEV.input, summary: environmentSummarySchema.parse({ ...DEV_SUMMARY, ...overrides }) };
}

export const syntheticSeveralContainers = derived({
  applications: [
    {
      ...APPLICATION,
      containers: [
        RUNNING,
        {
          ...RUNNING,
          container: "istio-proxy",
          image: "docker.io/istio/proxyv2",
          vulnerabilities: NO_FINDING_COUNTS,
          secrets: 2,
        },
        STOPPED,
      ],
    },
  ],
});

export const syntheticNoVulnerabilityReport = derived({
  applications: [{ ...APPLICATION, containers: [{ ...RUNNING, vulnerabilities: null }] }],
});

export const syntheticApplicationNotRunning = derived({
  applications: [{ ...APPLICATION, state: "notRunning", containers: [STOPPED] }],
});

export const syntheticApplicationsNotListed = derived({
  containers: { ...DEV_SUMMARY.containers, withoutCodebase: null },
  applications: null,
});

export const syntheticNamespaceNotRunning = derived({
  runtime: { state: "notRunning", url: DEV_RUNTIME.url },
  containers: {
    scanned: 0,
    withoutCodebase: 0,
    notRunning: DEV_SUMMARY.containers.scanned + DEV_SUMMARY.containers.notRunning,
  },
  applications: [{ ...APPLICATION, state: "notRunning", containers: [STOPPED] }],
});

export const syntheticSecretsTruncated = derived({
  runtime: {
    ...DEV_RUNTIME,
    secrets: { ...NO_FINDING_COUNTS, High: TRIAGED_RUNTIME_SCAN_LIMIT },
    secretsTruncated: true,
  },
});
