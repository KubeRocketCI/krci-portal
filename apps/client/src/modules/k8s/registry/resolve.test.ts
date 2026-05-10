import { describe, expect, it } from "vitest";
import { resolveDescriptor } from "./resolve";
import { resourceRegistry } from "./index";

describe("resolveDescriptor", () => {
  it("returns null for unknown kind", () => {
    expect(resolveDescriptor(resourceRegistry, "totally-fake")).toBeNull();
  });
});
