import { capitalizeFirstLetter } from "./index";
import { expect, test } from "vitest";

test("checking capitalizeFirstLetterFunc", () => {
  expect(capitalizeFirstLetter("test")).toMatch("Test");
  expect(capitalizeFirstLetter("")).toMatch("");
});
