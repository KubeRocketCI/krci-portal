// SYNTHETIC data: derived from the recording of the testbed, not recorded from it. Only for states the testbed does not
// hold.
import {
  DEFECTDOJO_MAX_PAGE_SIZE,
  DEFECTDOJO_SEVERITIES,
  NO_FINDING_COUNTS,
  type RuntimeContainer,
  type RuntimeLevel,
  type ScanFinding,
  type ScanFindings,
} from "@my-project/shared";
import { recordedCodebase, type RecordedCodebase } from "./seed";

export function syntheticTestGoApp(change: (runtime: RuntimeLevel) => RuntimeLevel): RecordedCodebase {
  const recorded = recordedCodebase("testGoApp");
  if (recorded.summary.state !== "data") {
    throw new Error("The recording of test-go-app holds no data");
  }

  const { levels } = recorded.summary;
  return { ...recorded, summary: { ...recorded.summary, levels: { ...levels, runtime: change(levels.runtime) } } };
}

function mapContainers(runtime: RuntimeLevel, map: (container: RuntimeContainer) => RuntimeContainer): RuntimeLevel {
  return {
    ...runtime,
    environments: runtime.environments.map((environment) => ({
      ...environment,
      containers: environment.containers.map(map),
    })),
  };
}

/** Every container closed: the level says "Not running". */
export function syntheticAllNotRunning(runtime: RuntimeLevel): RuntimeLevel {
  return {
    ...mapContainers(runtime, ({ workload, container, image, ownImage, productUrl }) => ({
      state: "notRunning",
      workload,
      container,
      image,
      ownImage,
      productUrl,
    })),
    state: "notRunning",
    lastUpload: null,
  };
}

/** Running containers without an active vulnerability or secret: the level says "No findings". */
export function syntheticNoActiveFindings(runtime: RuntimeLevel): RuntimeLevel {
  return {
    ...mapContainers(runtime, (container) =>
      container.state === "running"
        ? {
            ...container,
            vulnerabilities: container.vulnerabilities && { ...container.vulnerabilities, counts: NO_FINDING_COUNTS },
            secrets: container.secrets && { ...container.secrets, active: 0 },
          }
        : container
    ),
    state: "clean",
  };
}

/** Containers of images that are none of the own image: no Environment runs it. */
export function syntheticOtherImages(runtime: RuntimeLevel): RuntimeLevel {
  return mapContainers(runtime, (container) => ({
    ...container,
    image: "docker.io/library/other",
    ownImage: false,
  }));
}

export const SYNTHETIC_COMPONENT_COUNT = 12;

/**
 * A page of `count` active findings of a scan that holds `total`, spread over `SYNTHETIC_COMPONENT_COUNT`
 * components named `synthetic-pkg-N`.
 */
export function syntheticFindingsPage(total: number, count = DEFECTDOJO_MAX_PAGE_SIZE): ScanFindings {
  const findings = Array.from({ length: count }, (_, index): ScanFinding => {
    const severity = DEFECTDOJO_SEVERITIES[Math.min(Math.floor(index / 25), DEFECTDOJO_SEVERITIES.length - 1)];

    return {
      title: `CVE-2098-${String(index).padStart(5, "0")}`,
      severity,
      active: true,
      mitigated: false,
      falsePositive: false,
      outOfScope: false,
      riskAccepted: false,
      underReview: false,
      date: null,
      componentName: `synthetic-pkg-${index % SYNTHETIC_COMPONENT_COUNT}`,
      componentVersion: "1.0.0",
      vulnerabilityIds: [`CVE-2098-${String(index).padStart(5, "0")}`],
      filePath: null,
      line: null,
      fixAvailable: true,
      fixVersion: null,
      url: `https://defectdojo.example.test/finding/synthetic-${index}`,
    };
  });

  return { state: "data", total, findings };
}
