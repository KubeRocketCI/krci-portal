import { describe, expect, it } from "vitest";
import { groupBy } from "./index.js";

describe("groupBy", () => {
  it("collects the values of each key in the order of the items and leaves out an item without a key", () => {
    const items = [
      { key: "b", value: 1 },
      { key: null, value: 2 },
      { key: "a", value: 3 },
      { key: "b", value: 4 },
    ];

    expect([
      ...groupBy(
        items,
        (item) => item.key,
        (item) => item.value
      ),
    ]).toEqual([
      ["b", [1, 4]],
      ["a", [3]],
    ]);
  });
});
