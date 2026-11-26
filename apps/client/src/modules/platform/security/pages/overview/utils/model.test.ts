import {
  NO_FINDING_COUNTS,
  type OverviewCodebase,
  type OverviewNamespace,
  type OverviewScan,
  type SeverityCounts,
} from "@my-project/shared";
import { describe, expect, it } from "vitest";
import {
  codebasesInView,
  isSecretScanType,
  levelsInView,
  namespacesInView,
  scanTarget,
  topCodebases,
  topNamespaces,
  unscannedInView,
} from "./model";

const counts = (found: Partial<SeverityCounts>): SeverityCounts => ({ ...NO_FINDING_COUNTS, ...found });

function namespace(
  cluster: string,
  name: string,
  { vulnerabilities = {}, secrets = {}, stage = null as string | null, managed = false, product = true } = {}
): OverviewNamespace {
  return {
    cluster,
    namespace: name,
    environment: stage === null ? null : { cdPipeline: "demo", stage },
    managed,
    product: product
      ? {
          url: `https://defectdojo.example.test/asset/${name}`,
          vulnerabilities: counts(vulnerabilities),
          secrets: counts(secrets),
        }
      : null,
  };
}

function scan(scanner: string, values: Partial<SeverityCounts>, image: string | null = null): OverviewScan {
  const level = image === null ? "code" : "image";
  return {
    ref: { level, branch: "main", scanner, image },
    ownImage: image !== null,
    version: "",
    date: "2026-11-23T10:00:00Z",
    testUrl: `https://defectdojo.example.test/test/${scanner}`,
    counts: counts(values),
  };
}

function codebase(name: string, scans: OverviewScan[]): OverviewCodebase {
  return { codebase: name, known: true, scans };
}

const DEV = namespace("in-cluster", "demo-dev", { vulnerabilities: { High: 2 }, secrets: { High: 1 }, stage: "dev" });
const ARGOCD = namespace("in-cluster", "argocd", { vulnerabilities: { Critical: 3, Low: 1 } });
const CLEAN = namespace("in-cluster", "krci-security");
const PROD = namespace("remote-cluster", "demo-prod", { stage: "prod", product: false });
const EDGE = namespace("edge", "ingress", { vulnerabilities: { Low: 4 } });
const NAMESPACES = [EDGE, DEV, ARGOCD, CLEAN, PROD];

const IMAGE = "registry.example.test/demo-app";
const DEMO = codebase("demo-app", [
  scan("Semgrep JSON Report", { Critical: 1 }),
  scan("Gitleaks Scan", { High: 2 }),
  scan("Trivy Scan", { High: 5 }, IMAGE),
  scan("Anchore Grype", { High: 4, Low: 1 }, IMAGE),
]);
const GITOPS = codebase("krci-gitops", [scan("Semgrep JSON Report", { Low: 3 }), scan("Trivy Scan", {}, IMAGE)]);

describe("namespacesInView", () => {
  it("keeps the namespaces of the selected clusters", () => {
    expect(namespacesInView(NAMESPACES, { clusters: ["in-cluster"] })).toEqual([DEV, ARGOCD, CLEAN]);
  });

  it("keeps one namespace, or the namespace of one Environment", () => {
    const clusters = ["in-cluster", "remote-cluster"];

    expect(namespacesInView(NAMESPACES, { clusters, namespace: "argocd" })).toEqual([ARGOCD]);
    expect(namespacesInView(NAMESPACES, { clusters, environment: { cdPipeline: "demo", stage: "prod" } })).toEqual([
      PROD,
    ]);
  });

  it("keeps under a severity the namespaces with a vulnerability or a secret of it, ordered by it", () => {
    expect(namespacesInView(NAMESPACES, { clusters: ["in-cluster", "edge"], severity: "Low" })).toEqual([EDGE, ARGOCD]);
    expect(namespacesInView(NAMESPACES, { clusters: ["in-cluster"], severity: "High" })).toEqual([DEV]);
  });
});

describe("codebasesInView", () => {
  it("keeps one codebase, and the scans of one level", () => {
    expect(codebasesInView([DEMO, GITOPS], { codebase: "krci-gitops" })).toEqual([GITOPS]);
    expect(codebasesInView([DEMO, GITOPS], { level: "code" }).map(({ scans }) => scans.length)).toEqual([2, 1]);
  });

  it("keeps under a severity the scans with a finding of it, and the codebases that keep one", () => {
    expect(codebasesInView([DEMO, GITOPS], { severity: "Low" })).toEqual([
      { ...DEMO, scans: [DEMO.scans[3]] },
      { ...GITOPS, scans: [GITOPS.scans[0]] },
    ]);
    expect(codebasesInView([DEMO, GITOPS], { severity: "Info" })).toEqual([]);
  });
});

describe("unscannedInView", () => {
  it("keeps the codebase of the filter, and none under a severity: they have no counts", () => {
    expect(unscannedInView(["idle-app", "new-app"], { codebase: "new-app" })).toEqual(["new-app"]);
    expect(unscannedInView(["idle-app"], { severity: "High" })).toEqual([]);
  });
});

describe("topNamespaces", () => {
  it("are the namespaces with findings, most severe first", () => {
    expect(topNamespaces(NAMESPACES)).toEqual([ARGOCD, DEV, EDGE]);
    expect(topNamespaces([CLEAN, PROD])).toEqual([]);
  });

  it("rank by the severity of the filter first", () => {
    expect(topNamespaces(NAMESPACES, "Low")).toEqual([EDGE, ARGOCD, DEV]);
  });
});

describe("topCodebases", () => {
  it("rank each codebase by its most severe scan, and show that scan", () => {
    expect(topCodebases([GITOPS, DEMO])).toEqual([
      { codebase: DEMO, scan: DEMO.scans[0] },
      { codebase: GITOPS, scan: GITOPS.scans[0] },
    ]);
  });

  it("rank by the severity of the filter first, and leave out a codebase without findings", () => {
    const clean = codebase("clean-app", [scan("Semgrep JSON Report", {})]);

    expect(topCodebases([DEMO, GITOPS, clean], "Low")).toEqual([
      { codebase: GITOPS, scan: GITOPS.scans[0] },
      { codebase: DEMO, scan: DEMO.scans[3] },
    ]);
  });

  it("leave out a codebase without scans", () => {
    expect(topCodebases([codebase("unscanned-app", []), DEMO])).toEqual([{ codebase: DEMO, scan: DEMO.scans[0] }]);
  });
});

describe("isSecretScanType", () => {
  it("is true for the scan types whose findings are exposed secrets", () => {
    expect(isSecretScanType("Gitleaks Scan")).toBe(true);
    expect(isSecretScanType("Semgrep JSON Report")).toBe(false);
  });
});

describe("scanTarget", () => {
  it("names the branch, and the image with its tag when the scan has one", () => {
    expect(scanTarget(DEMO.scans[0])).toBe("Branch main");
    expect(scanTarget({ ...DEMO.scans[2], version: "1.2.0" })).toBe(`Branch main, ${IMAGE}:1.2.0`);
    expect(scanTarget(DEMO.scans[2])).toBe(`Branch main, ${IMAGE}`);
  });
});

describe("levelsInView", () => {
  it("are every level without a filter, in the order of the cards: Code, Image, Runtime", () => {
    expect(levelsInView(undefined)).toEqual({ scanLevels: ["code", "image"], runtime: true });
  });

  it("are the one level of the filter", () => {
    expect(levelsInView("runtime")).toEqual({ scanLevels: [], runtime: true });
    expect(levelsInView("code")).toEqual({ scanLevels: ["code"], runtime: false });
  });
});
