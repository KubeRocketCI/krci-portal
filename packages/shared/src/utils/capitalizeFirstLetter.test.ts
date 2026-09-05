import { describe, it, expect } from "vitest";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter.js";

describe("capitalizeFirstLetter", () => {
  it("should capitalize the first letter of a lowercase word", () => {
    expect(capitalizeFirstLetter("test")).toBe("Test");
  });

  it("should leave an already-capitalized word unchanged", () => {
    expect(capitalizeFirstLetter("Test")).toBe("Test");
  });

  it("should leave a non-letter first character unchanged", () => {
    expect(capitalizeFirstLetter("1abc")).toBe("1abc");
  });

  it("should return an empty string unchanged", () => {
    expect(capitalizeFirstLetter("")).toBe("");
  });

  it("should return null unchanged", () => {
    expect(capitalizeFirstLetter(null as unknown as string)).toBe(null);
  });

  it("should return undefined unchanged", () => {
    expect(capitalizeFirstLetter(undefined as unknown as string)).toBe(undefined);
  });
});
