import { describe, expect, test } from "vitest";
import { getCodemieProjectSettingsStatusIcon } from "./index";
import { codemieProjectSettingsStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import type { CodemieProjectSettings } from "@my-project/shared";

describe("getCodemieProjectSettingsStatusIcon", () => {
  test("returns unknown icon for undefined codemieProjectSettings", () => {
    const result = getCodemieProjectSettingsStatusIcon(undefined);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for undefined status", () => {
    const codemieProjectSettings: CodemieProjectSettings = {
      status: {},
    } as unknown as CodemieProjectSettings;

    const result = getCodemieProjectSettingsStatusIcon(codemieProjectSettings);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for created status", () => {
    const codemieProjectSettings: CodemieProjectSettings = {
      status: { value: codemieProjectSettingsStatus.created },
    } as unknown as CodemieProjectSettings;

    const result = getCodemieProjectSettingsStatusIcon(codemieProjectSettings);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for error status", () => {
    const codemieProjectSettings: CodemieProjectSettings = {
      status: { value: codemieProjectSettingsStatus.error },
    } as unknown as CodemieProjectSettings;

    const result = getCodemieProjectSettingsStatusIcon(codemieProjectSettings);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("handles case-insensitive status", () => {
    const codemieProjectSettings: CodemieProjectSettings = {
      status: { value: "CREATED" },
    } as unknown as CodemieProjectSettings;

    const result = getCodemieProjectSettingsStatusIcon(codemieProjectSettings);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown status", () => {
    const codemieProjectSettings: CodemieProjectSettings = {
      status: { value: "unknown-status" },
    } as unknown as CodemieProjectSettings;

    const result = getCodemieProjectSettingsStatusIcon(codemieProjectSettings);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
