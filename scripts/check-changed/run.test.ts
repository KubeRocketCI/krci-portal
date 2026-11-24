import { describe, expect, it } from "vitest";
import { runPool, runStep } from "./run.js";

describe("runPool", () => {
  it("keeps the task order in the results and never exceeds the limit", async () => {
    let inFlight = 0;
    let peak = 0;
    const task = (value: number, delayMs: number) => async () => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      inFlight--;
      return value;
    };

    const results = await runPool([task(1, 30), task(2, 5), task(3, 15), task(4, 1), task(5, 10)], 2);

    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(peak).toBe(2);
  });

  it("returns an empty list for no tasks", async () => {
    expect(await runPool([], 4)).toEqual([]);
  });
});

describe("runStep", () => {
  const node = (script: string) => ({ label: "node", cwd: process.cwd(), argv: [process.execPath, "-e", script] });

  it("captures stdout and stderr and reports the exit code", async () => {
    const result = await runStep(node('console.log("out"); console.error("err"); process.exit(4)'), true);

    expect(result.status).toBe(4);
    expect(result.output).toContain("out");
    expect(result.output).toContain("err");
  });

  it("reports status 1 for a command that cannot start", async () => {
    const result = await runStep({ label: "missing", cwd: process.cwd(), argv: ["check-changed-no-such-bin"] }, true);

    expect(result.status).toBe(1);
    expect(result.output).toContain("check-changed-no-such-bin");
  });
});
