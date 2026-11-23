import { describe, expect, it, vi } from "vitest";
import { routeProjectDetails } from "./route";

// The parent route pulls in the tRPC client; the search is validated without it.
vi.mock("@/core/router/routes", () => ({ routeCluster: {} }));

function validateSearch(search: Record<string, unknown>) {
  const validate = routeProjectDetails.options.validateSearch;
  if (typeof validate !== "function") {
    throw new Error("The route validates its search with a function");
  }
  return validate(search);
}

describe("the search of the codebase page", () => {
  it("accepts ?tab=findings", () => {
    expect(validateSearch({ tab: "findings" })).toMatchObject({ tab: "findings" });
  });

  it("opens Overview without a tab", () => {
    expect(validateSearch({})).toMatchObject({ tab: "overview" });
  });

  it("rejects a tab it does not have", () => {
    expect(() => validateSearch({ tab: "no-such-tab" })).toThrow();
  });
});
