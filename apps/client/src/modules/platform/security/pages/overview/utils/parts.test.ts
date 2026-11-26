import { describe, expect, it, vi } from "vitest";
import { failureOf, groupFailures, showsPlaceholder, type Part } from "./parts";

type Query = NonNullable<Part["query"]>;

function part(query: Partial<Query> | null, what = "Runtime findings"): Part {
  return {
    what,
    query:
      query === null
        ? null
        : { data: undefined, isPending: false, error: null, isFetching: false, refetch: vi.fn(), ...query },
    noScanData: null,
  };
}

const DATA = part({ data: { state: "data" } });
const NO_SCAN_DATA = part({ data: { state: "noScanData" } });
const UNREACHABLE = part({ data: { state: "unreachable" } });
const FAILED = part({ error: new Error("namespaces is forbidden") });
const LOADING = part({ isPending: true });
const NOT_ASKED = part(null);

describe("failureOf", () => {
  it("is DefectDojo unreachable, or the message of a failed request", () => {
    expect(failureOf(UNREACHABLE)).toEqual({ kind: "unreachable" });
    expect(failureOf(FAILED)).toEqual({ kind: "failed", message: "namespaces is forbidden" });
  });

  it("is none while the part loads, when it is not asked for, and once it answers", () => {
    expect([LOADING, NOT_ASKED, DATA, NO_SCAN_DATA].map(failureOf)).toEqual([null, null, null, null]);
  });
});

describe("showsPlaceholder", () => {
  it("is true for every state but data", () => {
    expect([NOT_ASKED, LOADING, FAILED, UNREACHABLE, NO_SCAN_DATA, DATA].map(showsPlaceholder)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
  });
});

describe("groupFailures", () => {
  it("puts parts that failed alike in one group, and the others apart", () => {
    const codebasesUnreachable = part({ data: { state: "unreachable" } }, "Code and Image findings");

    expect(groupFailures([UNREACHABLE, codebasesUnreachable])).toEqual([
      { failure: { kind: "unreachable" }, failed: [UNREACHABLE, codebasesUnreachable] },
    ]);
    expect(groupFailures([FAILED, part({ error: new Error("codebases is forbidden") })])).toHaveLength(2);
    expect(groupFailures([DATA, LOADING, NOT_ASKED])).toEqual([]);
  });
});
