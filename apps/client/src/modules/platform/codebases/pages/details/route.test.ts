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

  describe("the Environment to focus", () => {
    it("accepts ?tab=findings&cdPipeline=demo&stage=dev", () => {
      expect(validateSearch({ tab: "findings", cdPipeline: "demo", stage: "dev" })).toEqual({
        tab: "findings",
        cdPipeline: "demo",
        stage: "dev",
      });
    });

    it.each([
      ["cdPipeline", { cdPipeline: "demo" }],
      ["stage", { stage: "dev" }],
    ])("accepts the %s alone and keeps it as it is", (_, search) => {
      expect(validateSearch({ tab: "findings", ...search })).toEqual({ tab: "findings", ...search });
    });

    it("leaves both out of the search without them", () => {
      const search = validateSearch({ tab: "findings" });

      expect(search).not.toHaveProperty("cdPipeline");
      expect(search).not.toHaveProperty("stage");
    });

    it.each([
      ["a stage that is a number", { stage: 2024 }, { stage: "2024" }],
      ["a cdPipeline that is a number", { cdPipeline: 7 }, { cdPipeline: "7" }],
    ])("takes %s as its name: the router parses search values as JSON", (_, search, expected) => {
      expect(validateSearch({ tab: "findings", ...search })).toEqual({ tab: "findings", ...expected });
    });

    it.each([
      ["an empty cdPipeline", { cdPipeline: "" }],
      ["an empty stage", { stage: "" }],
      ["a stage that is no Kubernetes name", { stage: "Dev Stage" }],
    ])("drops %s and opens the tab without a focus", (_, search) => {
      expect(validateSearch({ tab: "findings", ...search })).toEqual({ tab: "findings" });
    });
  });
});
