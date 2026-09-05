import { describe, expect, it } from "vitest";
import { getPipelineRunStatus } from "./index.js";
import { pipelineRunReasonEnum } from "../../schema.js";
import type { PipelineRun } from "../../types.js";
import { tektonResultAnnotations } from "../../../../../../tektonResults/annotations.js";

type ConditionStatus = "True" | "False" | "Unknown";

const makeRun = ({
  status,
  reason,
  history = false,
  extraConditionFirst = false,
}: {
  status?: ConditionStatus;
  reason?: string;
  history?: boolean;
  extraConditionFirst?: boolean;
} = {}): PipelineRun => {
  const succeededCondition = {
    type: "Succeeded",
    status,
    ...(reason !== undefined ? { reason } : {}),
  };

  const conditions =
    status === undefined
      ? []
      : extraConditionFirst
        ? [{ type: "Ready", status: "False", reason: "nope" }, succeededCondition]
        : [succeededCondition];

  return {
    metadata: {
      name: "run",
      namespace: "ns",
      annotations: history ? { [tektonResultAnnotations.historySource]: "true" } : undefined,
    },
    spec: {},
    status: {
      conditions,
      startTime: "2023-01-01T00:00:00Z",
      completionTime: "2023-01-01T01:00:00Z",
    },
  } as unknown as PipelineRun;
};

// Do not import these sets from constants.ts. The test must catch a regression there.
const CANCELLED_REASONS = new Set(["cancelled", "pipelineruncancelled"]);
const CANCELLING_REASONS = new Set(["cancelledrunningfinally", "stoppedrunningfinally"]);

const REASONS: (string | undefined)[] = [...pipelineRunReasonEnum.options, "somethingnew", undefined];
const STATUSES: ConditionStatus[] = ["True", "False", "Unknown"];
const HISTORIES = [false, true];

type Case = { status: ConditionStatus; reason: string | undefined; history: boolean; expected: string };

const cases: Case[] = [];
for (const status of STATUSES) {
  for (const reason of REASONS) {
    for (const history of HISTORIES) {
      let expected: string;

      if (status === "True") {
        expected = "succeeded";
      } else if (status === "False") {
        expected = reason !== undefined && CANCELLED_REASONS.has(reason) ? "cancelled" : "failed";
      } else if (history) {
        expected = "unknown";
      } else {
        const isCancelFamily =
          reason !== undefined && (CANCELLED_REASONS.has(reason) || CANCELLING_REASONS.has(reason));
        expected = isCancelFamily ? "cancelling" : "in-progress";
      }

      cases.push({ status, reason, history, expected });
    }
  }
}

describe("getPipelineRunStatus", () => {
  it.each(cases)(
    "status=$status reason=$reason history=$history -> $expected",
    ({ status, reason, history, expected }) => {
      const result = getPipelineRunStatus(makeRun({ status, reason, history }));

      expect(result.phase).toBe(expected);
      expect(result.reason).toBe(reason?.toLowerCase());
    }
  );

  it("is in-progress when live and there is no Succeeded condition", () => {
    const result = getPipelineRunStatus(makeRun({ history: false }));

    expect(result.phase).toBe("in-progress");
    expect(result.reason).toBeUndefined();
  });

  it("is unknown when archived and there is no Succeeded condition", () => {
    const result = getPipelineRunStatus(makeRun({ history: true }));

    expect(result.phase).toBe("unknown");
    expect(result.reason).toBeUndefined();
  });

  it("is unknown for undefined input", () => {
    const result = getPipelineRunStatus(undefined);

    expect(result.phase).toBe("unknown");
    expect(result.reason).toBeUndefined();
    expect(result.message).toBe("No message");
    expect(result.lastTransitionTime).toBeUndefined();
    expect(result.startTime).toBeUndefined();
    expect(result.completionTime).toBeUndefined();
  });

  it("leaves all three time fields undefined when status is missing", () => {
    const run = {
      metadata: { name: "run", namespace: "ns" },
      spec: {},
    } as unknown as PipelineRun;

    const result = getPipelineRunStatus(run);

    expect(result.lastTransitionTime).toBeUndefined();
    expect(result.startTime).toBeUndefined();
    expect(result.completionTime).toBeUndefined();
  });

  it("passes startTime and completionTime through unchanged when set", () => {
    const result = getPipelineRunStatus(makeRun({ status: "True", reason: "Succeeded" }));

    expect(result.startTime).toBe("2023-01-01T00:00:00Z");
    expect(result.completionTime).toBe("2023-01-01T01:00:00Z");
  });

  it("selects the Succeeded condition even when another condition comes first", () => {
    const result = getPipelineRunStatus(makeRun({ status: "True", reason: "Succeeded", extraConditionFirst: true }));

    expect(result.phase).toBe("succeeded");
    expect(result.reason).toBe("succeeded");
  });

  it("lowercases the reason", () => {
    const result = getPipelineRunStatus(makeRun({ status: "True", reason: "Succeeded" }));

    expect(result.reason).toBe("succeeded");
  });
});
