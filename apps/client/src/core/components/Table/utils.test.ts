import { describe, expect, it } from "vitest";
import { getFlexPropertyByTextAlign } from "./utils";

describe("getFlexPropertyByTextAlign", () => {
  it("should return 'center' for center", () => {
    expect(getFlexPropertyByTextAlign("center")).toBe("center");
  });

  it("should return 'flex-end' for right", () => {
    expect(getFlexPropertyByTextAlign("right")).toBe("flex-end");
  });

  it("should return 'flex-start' for left", () => {
    expect(getFlexPropertyByTextAlign("left")).toBe("flex-start");
  });

  it("should return 'flex-start' for unknown values", () => {
    expect(getFlexPropertyByTextAlign("justify")).toBe("flex-start");
  });
});
