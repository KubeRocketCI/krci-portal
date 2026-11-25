import { renderHook } from "@testing-library/react";
import type { FindingsScope } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useFindingFilterData, type FindingFilterDataOptions } from "./useFindingFilterData";
import { useFindingsScope } from "./useFindingsScope";

vi.mock("./useFindingsScope", () => ({ useFindingsScope: vi.fn() }));
vi.mock("@/k8s/api/groups/KRCI/Codebase", () => ({ useCodebaseWatchList: vi.fn() }));

const SCOPE: FindingsScope = {
  state: "data",
  defaultClusters: ["in-cluster", "remote-cluster"],
  stageClusters: ["in-cluster", "remote-cluster"],
  clusters: ["edge", "in-cluster", "remote-cluster"],
  namespaces: [],
};

function given(scope: FindingsScope, codebases: string[] = []) {
  vi.mocked(useFindingsScope).mockReturnValue({ data: scope } as ReturnType<typeof useFindingsScope>);
  vi.mocked(useCodebaseWatchList).mockReturnValue({
    data: { array: codebases.map((name) => ({ metadata: { name } })) },
  } as unknown as ReturnType<typeof useCodebaseWatchList>);
}

function filterData(options: Partial<FindingFilterDataOptions> = {}) {
  return renderHook(() => useFindingFilterData({ namespace: "krci", clusters: undefined, ...options })).result.current;
}

describe("useFindingFilterData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("presses the default clusters of the scope until the user picks clusters", () => {
    given(SCOPE);

    expect(filterData().selectedClusters).toEqual(["in-cluster", "remote-cluster"]);
    expect(filterData({ clusters: ["edge"] }).selectedClusters).toEqual(["edge"]);
  });

  it("gives no scope and presses no cluster while the scope cannot be read", () => {
    given({ state: "unreachable" });

    expect(filterData()).toMatchObject({ scope: null, selectedClusters: [] });
  });

  it("names the Codebases of the namespace in order, and reads them only when asked", () => {
    given(SCOPE, ["web", "api"]);

    expect(filterData().codebases).toEqual(["api", "web"]);
    filterData({ readCodebases: false });
    expect(useCodebaseWatchList).toHaveBeenLastCalledWith({ namespace: "krci", queryOptions: { enabled: false } });
  });
});
