import { describe, expect, it } from "vitest";
import {
  DEMO_APPLICATION,
  DEMO_IMAGE,
  DEMO_STAGE_NAMESPACE,
  makeRuntimeTest,
  makeTest,
} from "../__fixtures__/testDoubles.js";
import { buildRuntimeContainers, runtimeTestsFilter } from "./runtime.js";
import { createOwnImageMatcher } from "./scans.js";

const IS_OWN_IMAGE = createOwnImageMatcher({ ownImageNames: [DEMO_IMAGE] });

const ENVIRONMENT = { clusterName: "in-cluster", namespace: DEMO_STAGE_NAMESPACE, applicationName: DEMO_APPLICATION };

describe("runtimeTestsFilter", () => {
  it("selects the tests of an Environment by its cluster, namespace and application tags", () => {
    expect(runtimeTestsFilter(ENVIRONMENT)).toStrictEqual({
      tags: ["k8s-cluster:in-cluster", "k8s-namespace:demo-dev", "app:demo-dev-demo-app"],
    });
  });

  it("takes the cluster of the Stage: a remote Stage selects the tests of the remote cluster", () => {
    expect(runtimeTestsFilter({ ...ENVIRONMENT, clusterName: "remote" }).tags).toContain("k8s-cluster:remote");
  });

  it("adds the workload, container and report-kind tags to narrow the Environment to one report of one container", () => {
    const filter = runtimeTestsFilter(ENVIRONMENT, {
      workload: "deployment.demo-app",
      container: "istio-proxy",
      reportKind: "exposedsecretreport",
    });

    expect(filter.tags).toEqual([
      "k8s-cluster:in-cluster",
      "k8s-namespace:demo-dev",
      "app:demo-dev-demo-app",
      "k8s-workload:deployment.demo-app",
      "k8s-container:istio-proxy",
      "report-kind:exposedsecretreport",
    ]);
  });

  it("asks for no branch and no scan type", () => {
    expect(runtimeTestsFilter(ENVIRONMENT)).not.toHaveProperty("branchTag");
    expect(runtimeTestsFilter(ENVIRONMENT)).not.toHaveProperty("scanType");
  });
});

describe("buildRuntimeContainers", () => {
  describe("the tests that make a container", () => {
    it("are runtime tests with a workload, a container and a known report kind", () => {
      const containers = buildRuntimeContainers([makeRuntimeTest({ id: 1 })], IS_OWN_IMAGE);

      expect(containers.map(({ workload, container }) => [workload, container])).toEqual([
        ["deployment.demo-app", "demo-app"],
      ]);
    });

    it.each([
      ["no report-kind tag", { reportKind: null }],
      ["no k8s-workload tag", { workload: null }],
      ["no k8s-container tag", { container: null }],
      ["a report kind the tab does not read", { reportKind: "configauditreport" }],
    ])("leave out a test with %s", (_, change) => {
      expect(buildRuntimeContainers([makeRuntimeTest({ id: 1, ...change })], IS_OWN_IMAGE)).toEqual([]);
    });

    it("leave out a test of another level, whatever it is tagged", () => {
      const ciTest = makeTest({
        id: 1,
        scanType: "Trivy Scan",
        tags: ["k8s-workload:deployment.demo-app", "k8s-container:demo-app", "report-kind:vulnerabilityreport"],
      });

      expect(buildRuntimeContainers([ciTest], IS_OWN_IMAGE)).toEqual([]);
    });

    it("take the kind from the tag, not from the title", () => {
      const [container] = buildRuntimeContainers(
        [makeRuntimeTest({ id: 1, reportKind: "exposedsecretreport", title: "VulnerabilityReport demo-app" })],
        IS_OWN_IMAGE
      );

      expect(container).toMatchObject({ state: "running", vulnerabilities: null, secrets: { testId: 1 } });
    });
  });

  describe("the rows", () => {
    it("are one per workload and container, with the tests of both report kinds in it", () => {
      const containers = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, reportKind: "vulnerabilityreport" }),
          makeRuntimeTest({ id: 2, reportKind: "exposedsecretreport" }),
        ],
        IS_OWN_IMAGE
      );

      expect(containers).toHaveLength(1);
      expect(containers[0]).toMatchObject({
        state: "running",
        vulnerabilities: { testId: 1, testUrl: "https://defectdojo.example.test/test/1" },
        secrets: { testId: 2, testUrl: "https://defectdojo.example.test/test/2" },
      });
    });

    it("are two for a workload with a sidecar, and two for two workloads", () => {
      const containers = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1 }),
          makeRuntimeTest({ id: 2, container: "istio-proxy", image: "docker.io/istio/proxyv2" }),
          makeRuntimeTest({
            id: 3,
            workload: "statefulset.demo-db",
            container: "db",
            image: "docker.io/library/postgres",
          }),
        ],
        IS_OWN_IMAGE
      );

      expect(containers.map(({ workload, container }) => [workload, container])).toEqual([
        ["deployment.demo-app", "demo-app"],
        ["deployment.demo-app", "istio-proxy"],
        ["statefulset.demo-db", "db"],
      ]);
    });

    it("link to the product of the container's tests", () => {
      const [container] = buildRuntimeContainers([makeRuntimeTest({ id: 1 })], IS_OWN_IMAGE);

      expect(container.productUrl).toBe("https://defectdojo.example.test/asset/7");
    });
  });

  describe("the test kept of one container and report kind", () => {
    it("is the open one before a closed one, whatever their dates", () => {
      const [container] = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, buildId: "", updated: "2026-11-24T10:00:00Z" }),
          makeRuntimeTest({ id: 2, updated: "2026-11-20T10:00:00Z" }),
        ],
        IS_OWN_IMAGE
      );

      expect(container).toMatchObject({ state: "running", vulnerabilities: { testId: 2 } });
    });

    it("is the open one when it comes before the closed one in the list", () => {
      const [container] = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 2, updated: "2026-11-20T10:00:00Z" }),
          makeRuntimeTest({ id: 1, buildId: "", updated: "2026-11-24T10:00:00Z" }),
        ],
        IS_OWN_IMAGE
      );

      expect(container).toMatchObject({ state: "running", vulnerabilities: { testId: 2 } });
    });

    it("is the newest of two open ones, and between equal dates the later test", () => {
      const byDate = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, updated: "2026-11-24T10:00:00Z" }),
          makeRuntimeTest({ id: 2, updated: "2026-11-22T10:00:00Z" }),
        ],
        IS_OWN_IMAGE
      );
      const byId = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 3, updated: "2026-11-24T10:00:00Z" }),
          makeRuntimeTest({ id: 4, updated: "2026-11-24T10:00:00Z" }),
        ],
        IS_OWN_IMAGE
      );

      expect(byDate[0]).toMatchObject({ vulnerabilities: { testId: 1 } });
      expect(byId[0]).toMatchObject({ vulnerabilities: { testId: 4 } });
    });

    it("is the newest of the closed ones when every test is closed", () => {
      const [container] = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, buildId: "", updated: "2026-11-20T10:00:00Z", image: "docker.io/old/image" }),
          makeRuntimeTest({ id: 2, buildId: "", updated: "2026-11-22T10:00:00Z" }),
        ],
        IS_OWN_IMAGE
      );

      expect(container).toMatchObject({ state: "notRunning", image: DEMO_IMAGE });
    });
  });

  describe("a running container", () => {
    it("is one with an open test", () => {
      const [container] = buildRuntimeContainers([makeRuntimeTest({ id: 1, version: "main-20261124" })], IS_OWN_IMAGE);

      expect(container).toMatchObject({ state: "running", version: "main-20261124" });
    });

    it("drops the closed test of the other kind: it is neither counted nor shown", () => {
      const [container] = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, reportKind: "vulnerabilityreport", buildId: "" }),
          makeRuntimeTest({ id: 2, reportKind: "exposedsecretreport" }),
        ],
        IS_OWN_IMAGE
      );

      expect(container).toMatchObject({ state: "running", vulnerabilities: null, secrets: { testId: 2 } });
    });

    it("takes its version from the VulnerabilityReport test, else from the other", () => {
      const both = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, reportKind: "exposedsecretreport", version: "from-secrets" }),
          makeRuntimeTest({ id: 2, reportKind: "vulnerabilityreport", version: "from-vulnerabilities" }),
        ],
        IS_OWN_IMAGE
      );
      const secretsOnly = buildRuntimeContainers(
        [makeRuntimeTest({ id: 3, reportKind: "exposedsecretreport", version: "from-secrets" })],
        IS_OWN_IMAGE
      );

      expect(both[0]).toMatchObject({ version: "from-vulnerabilities" });
      expect(secretsOnly[0]).toMatchObject({ version: "from-secrets" });
    });

    it("keeps an empty version when the scanner reports none", () => {
      const [container] = buildRuntimeContainers([makeRuntimeTest({ id: 1, version: "" })], IS_OWN_IMAGE);

      expect(container).toMatchObject({ state: "running", version: "" });
    });

    it("dates its last upload by the latest of its open tests", () => {
      const [container] = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, reportKind: "vulnerabilityreport", updated: "2026-11-22T10:00:00Z" }),
          makeRuntimeTest({ id: 2, reportKind: "exposedsecretreport", updated: "2026-11-24T09:30:00Z" }),
          makeRuntimeTest({ id: 3, reportKind: "vulnerabilityreport", buildId: "", updated: "2026-11-25T00:00:00Z" }),
        ],
        IS_OWN_IMAGE
      );

      expect(container).toMatchObject({ date: "2026-11-24T09:30:00Z" });
    });
  });

  describe("a container that is not running", () => {
    it("is one whose tests are all closed, with no counts, version or date", () => {
      const containers = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, buildId: "", reportKind: "vulnerabilityreport" }),
          makeRuntimeTest({ id: 2, buildId: "", reportKind: "exposedsecretreport" }),
        ],
        IS_OWN_IMAGE
      );

      expect(containers).toStrictEqual([
        {
          state: "notRunning",
          workload: "deployment.demo-app",
          container: "demo-app",
          image: DEMO_IMAGE,
          ownImage: true,
          productUrl: "https://defectdojo.example.test/asset/7",
          app: DEMO_APPLICATION,
        },
      ]);
    });
  });

  describe("the image", () => {
    it("is the oci-image tag, and null for a test that has none", () => {
      const containers = buildRuntimeContainers(
        [makeRuntimeTest({ id: 1 }), makeRuntimeTest({ id: 2, container: "init", image: null })],
        IS_OWN_IMAGE
      );

      expect(containers.map(({ container, image }) => [container, image])).toEqual([
        ["demo-app", DEMO_IMAGE],
        ["init", null],
      ]);
    });

    it("is the codebase's own when a CodebaseImageStream of it names it, whatever the case of the name", () => {
      const containers = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1 }),
          makeRuntimeTest({ id: 2, container: "istio-proxy", image: "docker.io/istio/proxyv2" }),
          makeRuntimeTest({ id: 3, container: "init", image: null }),
        ],
        createOwnImageMatcher({ ownImageNames: ["Registry.Example.Test/Krci/Demo-App"] })
      );

      expect(containers.map(({ container, ownImage }) => [container, ownImage])).toEqual([
        ["demo-app", true],
        ["init", false],
        ["istio-proxy", false],
      ]);
    });
  });

  describe("the order", () => {
    it("is running before not running, then the own image, then workload, then container", () => {
      const containers = buildRuntimeContainers(
        [
          makeRuntimeTest({ id: 1, workload: "deployment.a", container: "stopped", buildId: "" }),
          makeRuntimeTest({ id: 2, workload: "deployment.b", container: "zeta", image: "docker.io/third/party" }),
          makeRuntimeTest({ id: 3, workload: "deployment.b", container: "alpha", image: "docker.io/third/party" }),
          makeRuntimeTest({ id: 4, workload: "deployment.c", container: "own" }),
          makeRuntimeTest({ id: 5, workload: "deployment.a", container: "third", image: "docker.io/third/party" }),
        ],
        IS_OWN_IMAGE
      );

      expect(containers.map(({ workload, container }) => `${workload}/${container}`)).toEqual([
        "deployment.c/own",
        "deployment.a/third",
        "deployment.b/alpha",
        "deployment.b/zeta",
        "deployment.a/stopped",
      ]);
    });
  });
});
