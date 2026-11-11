import { describe, expect, it } from "vitest";
import type { SecurityCiSummary, SecurityEnvironmentSummary } from "@my-project/shared";
import type { RequestError } from "@/core/types/global";
import {
  findEnvironmentApplication,
  formatCount,
  getCiEntryLabel,
  getOtherCodebases,
  getSecurityErrorMessage,
  getTotalCount,
  isNonRetryableRequestError,
  parseEnvironment,
  sortEntriesBySeverity,
} from "./utils";

const counts = { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 };

const ciEntry = (overrides: Partial<SecurityCiSummary>): SecurityCiSummary => ({
  kind: "code",
  engagement: "code-security-main",
  tools: [],
  counts,
  link: "https://dd.example.com/engagement/1",
  ...overrides,
});

const requestError = (httpStatus: number, message = "failed"): RequestError =>
  Object.assign(new Error(message), { data: { httpStatus } }) as unknown as RequestError;

describe("getCiEntryLabel", () => {
  it("labels a code scan with its branch", () => {
    expect(getCiEntryLabel(ciEntry({ kind: "code", branch: "main" }))).toBe("Code scan: main");
  });

  it("labels a code scan without a branch", () => {
    expect(getCiEntryLabel(ciEntry({ kind: "code" }))).toBe("Code scan");
  });

  it("labels an image scan with image and tag", () => {
    expect(getCiEntryLabel(ciEntry({ kind: "image", image: "busybox", tag: "1.36" }))).toBe("Image scan: busybox:1.36");
  });

  it("labels an image scan without a tag", () => {
    expect(getCiEntryLabel(ciEntry({ kind: "image", image: "busybox" }))).toBe("Image scan: busybox");
  });

  it("falls back to the engagement name when the image is unknown", () => {
    expect(getCiEntryLabel(ciEntry({ kind: "image", engagement: "image:busybox" }))).toBe("Image scan: image:busybox");
  });
});

const environmentSummary: SecurityEnvironmentSummary = {
  status: "OK",
  environment: "demo/dev",
  applications: [
    {
      codebase: "app-a",
      workloads: [],
      versions: [],
      counts: { ...counts, high: 1, low: 2 },
      link: "https://dd.example.com/a",
    },
    {
      codebase: "app-b",
      workloads: [],
      versions: [],
      counts: { ...counts, high: 3, unassigned: 4 },
      link: "https://dd.example.com/b",
    },
  ],
};

describe("findEnvironmentApplication", () => {
  it("returns the application of the codebase", () => {
    expect(findEnvironmentApplication(environmentSummary, "app-b")?.link).toBe("https://dd.example.com/b");
  });

  it("returns undefined for a codebase without runtime data", () => {
    expect(findEnvironmentApplication(environmentSummary, "app-c")).toBeUndefined();
  });

  it("returns undefined while the summary is not loaded", () => {
    expect(findEnvironmentApplication(undefined, "app-a")).toBeUndefined();
  });
});

describe("getOtherCodebases", () => {
  const [appA, appB] = environmentSummary.applications;

  it("returns the codebases that are not applications of the deployment", () => {
    expect(getOtherCodebases(environmentSummary, ["app-a", "app-c"])).toEqual({
      entries: [appB],
      link: "https://dd.example.com/b",
    });
  });

  it("keeps each codebase with its own counts and takes the link of the first", () => {
    expect(getOtherCodebases(environmentSummary, [])).toEqual({
      entries: [appA, appB],
      link: "https://dd.example.com/a",
    });
  });

  it("returns undefined when every codebase is an application of the deployment", () => {
    expect(getOtherCodebases(environmentSummary, ["app-a", "app-b"])).toBeUndefined();
  });

  it("returns undefined while the summary is not loaded", () => {
    expect(getOtherCodebases(undefined, ["app-a"])).toBeUndefined();
  });
});

describe("parseEnvironment", () => {
  it("splits the cdPipeline and the stage", () => {
    expect(parseEnvironment("demo/dev")).toEqual({ cdPipeline: "demo", stage: "dev" });
  });

  it("returns undefined for a value that is not <cdPipeline>/<stage>", () => {
    expect(parseEnvironment("demo")).toBeUndefined();
    expect(parseEnvironment("demo/")).toBeUndefined();
    expect(parseEnvironment("a/b/c")).toBeUndefined();
  });
});

describe("isNonRetryableRequestError", () => {
  it("is true for 403 and 404", () => {
    expect(isNonRetryableRequestError(requestError(403))).toBe(true);
    expect(isNonRetryableRequestError(requestError(404))).toBe(true);
  });

  it("is false for server errors and plain errors", () => {
    expect(isNonRetryableRequestError(requestError(500))).toBe(false);
    expect(isNonRetryableRequestError(new Error("network"))).toBe(false);
    expect(isNonRetryableRequestError(null)).toBe(false);
  });
});

describe("getSecurityErrorMessage", () => {
  it("explains a 403", () => {
    expect(getSecurityErrorMessage(requestError(403))).toContain("permissions");
  });

  it("explains a 404", () => {
    expect(getSecurityErrorMessage(requestError(404))).toContain("not found");
  });

  it("returns the error message otherwise", () => {
    expect(getSecurityErrorMessage(requestError(503, "DefectDojo is not configured"))).toBe(
      "DefectDojo is not configured"
    );
  });

  it("falls back to a generic message without an error", () => {
    expect(getSecurityErrorMessage(null)).toBe("Failed to load security findings.");
  });
});

describe("formatCount", () => {
  it("writes numbers below 10,000 in full", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(9_999)).toBe("9,999");
  });

  it("compacts numbers from 10,000", () => {
    expect(formatCount(10_000)).toBe("10K");
    expect(formatCount(12_400)).toBe("12.4K");
    expect(formatCount(1_234_567)).toBe("1.2M");
  });
});

describe("getTotalCount", () => {
  it("sums all severities", () => {
    expect(getTotalCount({ critical: 1, high: 2, medium: 3, low: 4, unassigned: 5 })).toBe(15);
  });
});

describe("sortEntriesBySeverity", () => {
  const entry = (name: string, overrides: Partial<typeof counts> = {}) => ({
    name,
    counts: { ...counts, ...overrides },
  });
  const sortNames = (entries: ReturnType<typeof entry>[]) =>
    sortEntriesBySeverity(entries, (item) => item.name).map((item) => item.name);

  it("orders by critical, then high, medium, low and unassigned", () => {
    const names = sortNames([
      entry("unassigned-only", { unassigned: 900 }),
      entry("high-heavy", { high: 50 }),
      entry("one-critical", { critical: 1 }),
      entry("low-heavy", { low: 500 }),
      entry("medium-heavy", { medium: 70 }),
    ]);

    expect(names).toEqual(["one-critical", "high-heavy", "medium-heavy", "low-heavy", "unassigned-only"]);
  });

  it("breaks ties by name", () => {
    expect(sortNames([entry("b", { high: 1 }), entry("a", { high: 1 })])).toEqual(["a", "b"]);
  });

  it("puts entries without findings last", () => {
    expect(sortNames([entry("clean"), entry("noisy", { unassigned: 1 })])).toEqual(["noisy", "clean"]);
  });

  it("does not mutate the input", () => {
    const input = [entry("b"), entry("a")];
    sortEntriesBySeverity(input, (item) => item.name);

    expect(input.map((item) => item.name)).toEqual(["b", "a"]);
  });
});
