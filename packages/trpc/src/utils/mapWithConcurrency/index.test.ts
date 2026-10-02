import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "./index.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("mapWithConcurrency", () => {
  it("keeps input order when calls finish out of order", async () => {
    const delays = [30, 5, 20, 1, 10];

    const results = await mapWithConcurrency(delays, 2, async (delay, index) => {
      await sleep(delay);
      return index;
    });

    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  it("never runs more than limit calls at once", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapWithConcurrency(Array.from({ length: 20 }), 3, async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await sleep(1);
      inFlight--;
    });

    expect(maxInFlight).toBe(3);
  });

  it("returns an empty array for no items", async () => {
    expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([]);
  });

  it("rejects with the first rejection and starts no new items after it", async () => {
    const started: number[] = [];

    await expect(
      mapWithConcurrency([0, 1, 2, 3, 4], 1, async (item) => {
        started.push(item);
        if (item === 1) throw new Error("boom");
        return item;
      })
    ).rejects.toThrow("boom");

    expect(started).toEqual([0, 1]);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects limit %s", async (limit) => {
    await expect(mapWithConcurrency([1], limit, async (item) => item)).rejects.toThrow(RangeError);
  });
});
