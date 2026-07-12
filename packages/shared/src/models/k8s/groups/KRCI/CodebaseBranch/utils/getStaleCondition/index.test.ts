import { describe, expect, it } from "vitest";
import type { CodebaseBranch } from "../../types.js";
import { checkIsStaleBranch } from "../checkIsStaleBranch/index.js";
import { getStaleCondition } from "./index.js";

const branch = (overrides: Partial<CodebaseBranch>): CodebaseBranch =>
  ({
    metadata: { name: "app-main", labels: {} },
    spec: { branchName: "main", codebaseName: "app" },
    ...overrides,
  }) as CodebaseBranch;

describe("getStaleCondition", () => {
  it("returns the Stale condition when present", () => {
    const stale = branch({
      status: {
        conditions: [
          { type: "Ready", status: "True" },
          { type: "Stale", status: "True", message: "Branch was not found in the git repository" },
        ],
      },
    } as Partial<CodebaseBranch>);

    expect(getStaleCondition(stale)?.message).toBe("Branch was not found in the git repository");
  });

  it("returns undefined when there is no Stale condition or no status", () => {
    expect(getStaleCondition(branch({}))).toBeUndefined();
    expect(
      getStaleCondition(
        branch({ status: { conditions: [{ type: "Ready", status: "True" }] } } as Partial<CodebaseBranch>)
      )
    ).toBeUndefined();
  });
});

describe("checkIsStaleBranch", () => {
  it("is true when the Stale condition is True or the stale label is set", () => {
    const byCondition = branch({
      status: { conditions: [{ type: "Stale", status: "True" }] },
    } as Partial<CodebaseBranch>);
    const byLabel = branch({
      metadata: { name: "app-main", labels: { "app.edp.epam.com/stale": "true" } },
    } as Partial<CodebaseBranch>);

    expect(checkIsStaleBranch(byCondition)).toBe(true);
    expect(checkIsStaleBranch(byLabel)).toBe(true);
    expect(checkIsStaleBranch(branch({}))).toBe(false);
  });

  it("accepts a precomputed stale condition instead of looking it up", () => {
    const unlabeled = branch({});

    expect(checkIsStaleBranch(unlabeled, { type: "Stale", status: "True" })).toBe(true);
    expect(checkIsStaleBranch(unlabeled, undefined)).toBe(false);
  });
});
