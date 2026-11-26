import { describe, expect, it } from "vitest";
import { plural } from ".";

describe("plural", () => {
  it("adds an s to the noun of any count but one", () => {
    expect(plural(1, "scan")).toBe("1 scan");
    expect(plural(0, "scan")).toBe("0 scans");
    expect(plural(3, "namespace")).toBe("3 namespaces");
  });
});
