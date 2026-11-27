import { describe, expect, it } from "vitest";
import { codebaseListSearch, type LinkContext } from "./links";

const LINKS: LinkContext = { clusterName: "core", namespace: "krci", severity: "High", state: "falsePositive" };

describe("the searches of the lists the overview links to", () => {
  it("open on one codebase, with the severity and the state of the page", () => {
    expect(codebaseListSearch("demo-app", LINKS)).toEqual({
      codebase: "demo-app",
      severity: "High",
      state: "falsePositive",
    });
  });
});
