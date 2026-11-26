import { describe, expect, it } from "vitest";
import { NO_FINDING_COUNTS, type SeverityCounts } from "./constants.js";
import { runtimeLines, scanTypeLines } from "./overview.js";
import type { OverviewCodebase, OverviewNamespace, OverviewScan } from "./types.js";

const counts = (values: Partial<SeverityCounts>): SeverityCounts => ({ ...NO_FINDING_COUNTS, ...values });

function namespace(name: string, product: { vulnerabilities: SeverityCounts; secrets: SeverityCounts } | null) {
  return {
    cluster: "in-cluster",
    namespace: name,
    environment: null,
    managed: false,
    product: product && { url: "", ...product },
  } satisfies OverviewNamespace;
}

function scan(scanner: string, values: Partial<SeverityCounts>, image: string | null = null): OverviewScan {
  return {
    ref: { level: image === null ? "code" : "image", branch: "main", scanner, image },
    ownImage: image !== null,
    version: "",
    date: "",
    testUrl: "",
    counts: counts(values),
  };
}

const codebase = (name: string, scans: OverviewScan[]): OverviewCodebase => ({ codebase: name, known: true, scans });

describe("runtimeLines", () => {
  it("add the vulnerabilities and, apart, the exposed secrets of the namespaces with a namespace product", () => {
    expect(
      runtimeLines([
        namespace("dev", { vulnerabilities: counts({ High: 2 }), secrets: counts({ High: 1 }) }),
        namespace("argocd", { vulnerabilities: counts({ Critical: 3 }), secrets: counts({}) }),
        namespace("prod", null),
      ])
    ).toEqual({ size: 2, vulnerabilities: counts({ Critical: 3, High: 2 }), secrets: counts({ High: 1 }) });
  });

  it("are none when no namespace has a namespace product", () => {
    expect(runtimeLines([namespace("prod", null)])).toBeNull();
  });
});

describe("scanTypeLines", () => {
  it("are a line per scan type of the level in the order of its scan types; two scanners of one image are never added", () => {
    const codebases = [
      codebase("demo-app", [
        scan("Semgrep JSON Report", { High: 1 }),
        scan("Anchore Grype", { High: 4 }, "registry.example.test/demo-app"),
        scan("Trivy Scan", { High: 5 }, "registry.example.test/demo-app"),
      ]),
      codebase("demo-gitops", [scan("Trivy Scan", { Low: 2 }, "registry.example.test/demo-gitops")]),
    ];

    expect(scanTypeLines(codebases, "image")).toEqual([
      { scanType: "Trivy Scan", counts: counts({ High: 5, Low: 2 }), size: 2 },
      { scanType: "Anchore Grype", counts: counts({ High: 4 }), size: 1 },
    ]);
    expect(scanTypeLines(codebases, "code")).toEqual([
      { scanType: "Semgrep JSON Report", counts: counts({ High: 1 }), size: 1 },
    ]);
  });
});
