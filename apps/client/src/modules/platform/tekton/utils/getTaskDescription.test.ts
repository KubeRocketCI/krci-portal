import { describe, expect, it } from "vitest";
import { getTaskDescription } from "./getTaskDescription";

describe("getTaskDescription", () => {
  it("returns the spec description first", () => {
    expect(getTaskDescription({ description: "From spec" }, { name: "build", description: "From pipeline" })).toBe(
      "From spec"
    );
  });

  it("falls back to the pipeline task description", () => {
    expect(getTaskDescription({ steps: [] }, { name: "build", description: "From pipeline" })).toBe("From pipeline");
  });

  it("returns an empty string without a description", () => {
    expect(getTaskDescription(undefined, { name: "build" })).toBe("");
    expect(getTaskDescription()).toBe("");
  });
});
