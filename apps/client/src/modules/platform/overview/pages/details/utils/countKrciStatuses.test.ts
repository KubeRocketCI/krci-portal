import { describe, expect, test } from "vitest";
import { cdPipelineStatus, codebaseBranchStatus, codebaseStatus, stageStatus } from "@my-project/shared";
import { countKrciStatuses } from "./countKrciStatuses";

const item = (status?: string) => (status === undefined ? {} : { status: { status } });

describe("KRCI status enums", () => {
  test("all four resources still share one status enum", () => {
    const shared = Object.keys(codebaseStatus).sort();

    expect(Object.keys(codebaseBranchStatus).sort()).toEqual(shared);
    expect(Object.keys(cdPipelineStatus).sort()).toEqual(shared);
    expect(Object.keys(stageStatus).sort()).toEqual(shared);
  });
});

describe("countKrciStatuses", () => {
  test("buckets each shared KRCI status and folds initialized into in progress", () => {
    expect(
      countKrciStatuses([item("created"), item("initialized"), item("in_progress"), item("failed"), item()])
    ).toEqual({ total: 5, ok: 1, inProgress: 2, error: 1, cancelled: 0, unknown: 1 });
  });

  test("counts an unrecognised status as unknown rather than dropping it", () => {
    const counts = countKrciStatuses([item("something-new")]);

    expect(counts).toEqual({ total: 1, ok: 0, inProgress: 0, error: 0, cancelled: 0, unknown: 1 });
  });

  test("keeps the total equal to the sum of its buckets", () => {
    const items = [item("created"), item("failed"), item("in_progress"), item()];
    const { total, ok, inProgress, error, cancelled, unknown } = countKrciStatuses(items);

    expect(ok + inProgress + error + cancelled + unknown).toBe(total);
  });
});
