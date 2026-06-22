import { describe, expect, test } from "vitest";
import { getGitLabCIPipelineStatusIcon, isGitLabCIPipelineActive } from "./getStatusIcon";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { Ban, CircleCheck, CirclePause, CircleX, Clock, LoaderCircle, ShieldQuestion, SkipForward } from "lucide-react";

describe("getGitLabCIPipelineStatusIcon", () => {
  test("returns success icon for 'success' status", () => {
    const result = getGitLabCIPipelineStatusIcon("success");

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
    expect(result.title).toBe("Success");
    expect(result.isSpinning).toBeUndefined();
  });

  test("returns error icon for 'failed' status", () => {
    const result = getGitLabCIPipelineStatusIcon("failed");

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.title).toBe("Failed");
  });

  test("returns spinning loader for 'running' status", () => {
    const result = getGitLabCIPipelineStatusIcon("running");

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
    expect(result.title).toBe("Running");
  });

  test("returns clock icon for 'pending' status", () => {
    const result = getGitLabCIPipelineStatusIcon("pending");

    expect(result.component).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Pending");
  });

  test("returns clock icon for 'created' status", () => {
    const result = getGitLabCIPipelineStatusIcon("created");

    expect(result.component).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Created");
  });

  test("returns clock icon for 'preparing' status", () => {
    const result = getGitLabCIPipelineStatusIcon("preparing");

    expect(result.component).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Preparing");
  });

  test("returns clock icon for 'scheduled' status", () => {
    const result = getGitLabCIPipelineStatusIcon("scheduled");

    expect(result.component).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Scheduled");
  });

  test("returns clock icon for 'waiting_for_resource' status", () => {
    const result = getGitLabCIPipelineStatusIcon("waiting_for_resource");

    expect(result.component).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Waiting For Resource");
  });

  test("returns ban icon for 'canceled' status", () => {
    const result = getGitLabCIPipelineStatusIcon("canceled");

    expect(result.component).toBe(Ban);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.title).toBe("Canceled");
  });

  test("returns ban icon for 'cancelled' status (alternate spelling)", () => {
    const result = getGitLabCIPipelineStatusIcon("cancelled");

    expect(result.component).toBe(Ban);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.title).toBe("Canceled");
  });

  test("returns skip-forward icon for 'skipped' status", () => {
    const result = getGitLabCIPipelineStatusIcon("skipped");

    expect(result.component).toBe(SkipForward);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.title).toBe("Skipped");
  });

  test("returns pause icon for 'manual' status", () => {
    const result = getGitLabCIPipelineStatusIcon("manual");

    expect(result.component).toBe(CirclePause);
    expect(result.color).toBe(STATUS_COLOR.MISSING);
    expect(result.title).toBe("Manual");
  });

  test("returns unknown icon for undefined status", () => {
    const result = getGitLabCIPipelineStatusIcon(undefined);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.title).toBe("Unknown");
  });

  test("returns unknown icon with title-cased label for an unrecognised status", () => {
    const result = getGitLabCIPipelineStatusIcon("some_new_status");

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.title).toBe("Some New Status");
  });

  test("is case-insensitive (upper-case input normalises to lower-case)", () => {
    const result = getGitLabCIPipelineStatusIcon("SUCCESS");

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
    expect(result.title).toBe("Success");
  });
});

describe("isGitLabCIPipelineActive", () => {
  test.each(["running", "pending", "created", "preparing", "scheduled", "waiting_for_resource"])(
    "returns true for active status '%s'",
    (status) => {
      expect(isGitLabCIPipelineActive(status)).toBe(true);
    }
  );

  test.each(["success", "failed", "canceled", "cancelled", "skipped", "manual"])(
    "returns false for terminal status '%s'",
    (status) => {
      expect(isGitLabCIPipelineActive(status)).toBe(false);
    }
  );

  test("returns false for undefined status", () => {
    expect(isGitLabCIPipelineActive(undefined)).toBe(false);
  });

  test("returns false for an unrecognised status", () => {
    expect(isGitLabCIPipelineActive("some_new_status")).toBe(false);
  });

  test("is case-insensitive (upper-case input normalises to lower-case)", () => {
    expect(isGitLabCIPipelineActive("RUNNING")).toBe(true);
  });
});
