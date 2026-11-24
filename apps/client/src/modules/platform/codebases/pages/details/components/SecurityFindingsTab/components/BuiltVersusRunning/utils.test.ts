import { describe, expect, it } from "vitest";
import {
  DEFECTDOJO_MAX_PAGE_SIZE,
  type RuntimeContainer,
  type RuntimeEnvironment,
  type RuntimeLevel,
  type ScanFinding,
} from "@my-project/shared";
import type { RunningContainer } from "../../types";
import { groupByComponent, groupingNote, pairBuiltWithRunning } from "./utils";

const IMAGE = "registry.example.test/krci/app";

const BUILT = {
  ref: { level: "image", branch: "main", scanner: "Trivy Scan", image: IMAGE },
  version: "main-1",
} as const;

function running(overrides: Partial<RunningContainer> = {}): RunningContainer {
  return {
    state: "running",
    workload: "deployment.app",
    container: "app",
    image: IMAGE,
    ownImage: true,
    productUrl: "https://defectdojo.example.test/asset/1",
    version: "main-1",
    date: "2026-11-24T10:00:00Z",
    vulnerabilities: {
      counts: { Critical: 0, High: 1, Medium: 0, Low: 0, Info: 0 },
      triaged: 0,
      testUrl: "https://defectdojo.example.test/test/1",
    },
    secrets: null,
    ...overrides,
  };
}

function environment(stage: string, containers: RuntimeContainer[], cdPipeline = "demo"): RuntimeEnvironment {
  return { cdPipeline, stage, clusterName: "in-cluster", namespace: `${cdPipeline}-${stage}`, containers };
}

function level(...environments: RuntimeEnvironment[]): RuntimeLevel {
  return { state: "data", environments, lastUpload: null };
}

const stagesOf = (counterparts: ReturnType<typeof pairBuiltWithRunning>) =>
  counterparts.map(({ environment: { stage }, container }) => `${stage}/${container.container}`);

describe("pairBuiltWithRunning", () => {
  describe("the running side", () => {
    it("is every container that runs the built image, in every Environment", () => {
      const counterparts = pairBuiltWithRunning(
        BUILT,
        level(environment("dev", [running()]), environment("qa", [running()]), environment("prod", [running()])),
        null
      );

      expect(stagesOf(counterparts)).toEqual(["dev/app", "qa/app", "prod/app"]);
    });

    it("holds the containers of one Environment that run the image, in the order the server sent them", () => {
      const counterparts = pairBuiltWithRunning(
        BUILT,
        level(environment("dev", [running({ container: "web" }), running({ container: "worker" })])),
        null
      );

      expect(stagesOf(counterparts)).toEqual(["dev/web", "dev/worker"]);
    });

    it("leaves out a container of another image, one that is not running, and one with no image", () => {
      const counterparts = pairBuiltWithRunning(
        BUILT,
        level(
          environment("dev", [
            running({ container: "proxy", image: "docker.io/istio/proxyv2", ownImage: false }),
            {
              state: "notRunning",
              workload: "deployment.app",
              container: "stopped",
              image: IMAGE,
              ownImage: true,
              productUrl: "",
            },
            running({ container: "init", image: null, ownImage: false }),
            running({ container: "app" }),
          ])
        ),
        null
      );

      expect(stagesOf(counterparts)).toEqual(["dev/app"]);
    });

    it("compares the image names whatever their case: DefectDojo lower-cases tags", () => {
      const counterparts = pairBuiltWithRunning(
        { ...BUILT, ref: { ...BUILT.ref, image: "Registry.Example.Test/Krci/App" } },
        level(environment("dev", [running()])),
        null
      );

      expect(stagesOf(counterparts)).toEqual(["dev/app"]);
    });

    it("keeps a container that runs the image without an open VulnerabilityReport test: it has no counts to compare", () => {
      const counterparts = pairBuiltWithRunning(
        BUILT,
        level(environment("dev", [running({ vulnerabilities: null })])),
        null
      );

      expect(counterparts).toHaveLength(1);
      expect(counterparts[0].container.vulnerabilities).toBeNull();
    });

    it("is empty when no Environment runs the image, or the codebase is deployed nowhere", () => {
      expect(
        pairBuiltWithRunning(BUILT, level(environment("dev", [running({ image: "docker.io/library/nginx" })])), null)
      ).toEqual([]);
      expect(pairBuiltWithRunning(BUILT, level(), null)).toEqual([]);
    });

    it("is empty for a scan that has no image", () => {
      const codeScan = {
        ref: { level: "code", branch: "main", scanner: "Semgrep JSON Report", image: null },
        version: "",
      } as const;

      expect(pairBuiltWithRunning(codeScan, level(environment("dev", [running({ image: null })])), null)).toEqual([]);
    });
  });

  describe("the mark", () => {
    it.each([
      ["the same tag as the build", "main-1", "main-1", true],
      ["another tag than the build", "main-1", "0.9.0", false],
      ["no tag on the build", "", "main-1", null],
      ["no tag on the container", "main-1", "", null],
      ["no tag on either", "", "", null],
    ])("is for %s: sameTag %s", (_, builtVersion, runningVersion, sameTag) => {
      const [counterpart] = pairBuiltWithRunning(
        { ...BUILT, version: builtVersion },
        level(environment("dev", [running({ version: runningVersion })])),
        null
      );

      expect(counterpart.sameTag).toBe(sameTag);
    });

    it("compares the tags as they are: a tag that differs in case is another tag", () => {
      const [counterpart] = pairBuiltWithRunning(
        BUILT,
        level(environment("dev", [running({ version: "MAIN-1" })])),
        null
      );

      expect(counterpart.sameTag).toBe(false);
    });
  });

  describe("the Environment in focus", () => {
    const environments = [
      environment("dev", [running()]),
      environment("qa", [running()]),
      environment("prod", [running()]),
    ];

    it("comes first, and is marked: the others keep their order", () => {
      const counterparts = pairBuiltWithRunning(BUILT, level(...environments), { cdPipeline: "demo", stage: "prod" });

      expect(stagesOf(counterparts)).toEqual(["prod/app", "dev/app", "qa/app"]);
      expect(counterparts.map((counterpart) => counterpart.focused)).toEqual([true, false, false]);
    });

    it("has no effect when it is no Environment of the codebase", () => {
      const counterparts = pairBuiltWithRunning(BUILT, level(...environments), { cdPipeline: "demo", stage: "stage" });

      expect(stagesOf(counterparts)).toEqual(["dev/app", "qa/app", "prod/app"]);
      expect(counterparts.some((counterpart) => counterpart.focused)).toBe(false);
    });

    it("has no effect without a focus", () => {
      const counterparts = pairBuiltWithRunning(BUILT, level(...environments), null);

      expect(stagesOf(counterparts)).toEqual(["dev/app", "qa/app", "prod/app"]);
    });

    it("leads with all the containers of the focused Environment that run the image", () => {
      const counterparts = pairBuiltWithRunning(
        BUILT,
        level(
          environment("dev", [running()]),
          environment("qa", [running({ container: "web" }), running({ container: "worker" })])
        ),
        { cdPipeline: "demo", stage: "qa" }
      );

      expect(stagesOf(counterparts)).toEqual(["qa/web", "qa/worker", "dev/app"]);
    });
  });

  it("does not change the level it reads", () => {
    const input = level(environment("dev", [running()]), environment("qa", [running()]));
    const before = JSON.stringify(input);

    pairBuiltWithRunning(BUILT, input, { cdPipeline: "demo", stage: "qa" });

    expect(JSON.stringify(input)).toBe(before);
  });
});

function finding(overrides: Partial<ScanFinding>): ScanFinding {
  return {
    title: "A finding",
    severity: "High",
    active: true,
    mitigated: false,
    falsePositive: false,
    outOfScope: false,
    riskAccepted: false,
    underReview: false,
    date: null,
    componentName: "libssl3",
    componentVersion: "3.1.0",
    vulnerabilityIds: ["CVE-2099-0001"],
    filePath: null,
    line: null,
    fixAvailable: true,
    fixVersion: null,
    url: "https://defectdojo.example.test/finding/1",
    ...overrides,
  };
}

describe("groupByComponent", () => {
  it("is empty without findings", () => {
    expect(groupByComponent([])).toEqual([]);
  });

  it("makes one group of the findings that name one component and one version", () => {
    const first = finding({ url: "https://defectdojo.example.test/finding/1" });
    const second = finding({ url: "https://defectdojo.example.test/finding/2", vulnerabilityIds: ["CVE-2099-0002"] });

    const groups = groupByComponent([first, second]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ name: "libssl3", version: "3.1.0", findings: [first, second] });
  });

  it("keeps the versions of one component apart", () => {
    const groups = groupByComponent([
      finding({ componentVersion: "3.1.0" }),
      finding({ componentVersion: "3.0.2" }),
      finding({ componentVersion: null }),
    ]);

    expect(groups.map(({ name, version }) => [name, version])).toEqual([
      ["libssl3", "3.1.0"],
      ["libssl3", "3.0.2"],
      ["libssl3", null],
    ]);
  });

  it("counts the findings of a group by severity", () => {
    const [group] = groupByComponent([
      finding({ severity: "Critical" }),
      finding({ severity: "High" }),
      finding({ severity: "High" }),
      finding({ severity: "Info" }),
    ]);

    expect(group.counts).toEqual({ Critical: 1, High: 2, Medium: 0, Low: 0, Info: 1 });
  });

  it("names the findings that carry no component as No component", () => {
    const groups = groupByComponent([
      finding({ componentName: null, componentVersion: null, severity: "Low" }),
      finding({ componentName: null, componentVersion: null, severity: "Low" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ name: "No component", version: null });
    expect(groups[0].findings).toHaveLength(2);
  });

  it("does not mix a component that is called No component with the findings that have none", () => {
    const groups = groupByComponent([
      finding({ componentName: null, componentVersion: null }),
      finding({ componentName: "No component", componentVersion: null }),
    ]);

    expect(groups).toHaveLength(2);
  });

  describe("the order of the groups", () => {
    it("is the most severe finding first, whatever the order of the findings", () => {
      const groups = groupByComponent([
        finding({ componentName: "low-lib", severity: "Low" }),
        finding({ componentName: "critical-lib", severity: "Critical" }),
        finding({ componentName: "medium-lib", severity: "Medium" }),
      ]);

      expect(groups.map(({ name }) => name)).toEqual(["critical-lib", "medium-lib", "low-lib"]);
    });

    it("is the group with more findings first between equal severities, then by name", () => {
      const groups = groupByComponent([
        finding({ componentName: "beta", severity: "High" }),
        finding({ componentName: "alpha", severity: "High" }),
        finding({ componentName: "gamma", severity: "High" }),
        finding({ componentName: "gamma", severity: "Low" }),
      ]);

      expect(groups.map(({ name }) => name)).toEqual(["gamma", "alpha", "beta"]);
    });
  });

  it("does not change the findings it reads", () => {
    const input = [finding({ severity: "Low" }), finding({ componentName: "other", severity: "Critical" })];
    const before = JSON.stringify(input);

    groupByComponent(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("groupingNote", () => {
  it("says nothing when the page holds every active finding", () => {
    expect(groupingNote(0)).toBeNull();
    expect(groupingNote(DEFECTDOJO_MAX_PAGE_SIZE)).toBeNull();
  });

  it("says the groups come from the most severe findings of the largest page when there are more", () => {
    const total = DEFECTDOJO_MAX_PAGE_SIZE + 1;

    expect(groupingNote(total)).toBe(
      `Grouped from the ${DEFECTDOJO_MAX_PAGE_SIZE} most severe of ${total} active findings.`
    );
    expect(groupingNote(2 * DEFECTDOJO_MAX_PAGE_SIZE + 50)).toBe(
      `Grouped from the ${DEFECTDOJO_MAX_PAGE_SIZE} most severe of ${2 * DEFECTDOJO_MAX_PAGE_SIZE + 50} active findings.`
    );
  });
});
