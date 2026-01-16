import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX } from "lucide-react";
import type { GitServer } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns error icon for undefined status", () => {
    const gitServer: GitServer = {
      status: {},
    } as GitServer;

    const result = getStatusIcon(gitServer);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns success icon when connected is true", () => {
    const gitServer: GitServer = {
      status: { connected: true },
    } as GitServer;

    const result = getStatusIcon(gitServer);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon when connected is false", () => {
    const gitServer: GitServer = {
      status: { connected: false },
    } as GitServer;

    const result = getStatusIcon(gitServer);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });
});
