import { describe, expect, test } from "vitest";
import { getCodemieStatusIcon } from "./index";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX } from "lucide-react";
import type { Codemie } from "@my-project/shared";

describe("getCodemieStatusIcon", () => {
  test("returns success icon when connected is true", () => {
    const codemie: Codemie = {
      status: { connected: true },
    } as Codemie;

    const result = getCodemieStatusIcon(codemie);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon when connected is false", () => {
    const codemie: Codemie = {
      status: { connected: false },
    } as Codemie;

    const result = getCodemieStatusIcon(codemie);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns error icon when connected is undefined", () => {
    const codemie: Codemie = {
      status: {},
    } as Codemie;

    const result = getCodemieStatusIcon(codemie);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns error icon when codemie is undefined", () => {
    const result = getCodemieStatusIcon(undefined);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });
});
