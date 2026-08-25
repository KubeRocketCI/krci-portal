import { Stage } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { getStageDeleteDisabledState } from ".";

const unprotected = { isProtected: false, reason: "" };
const allowed = { allowed: true, reason: "" };

const makeStage = (cdPipeline: string, name: string, order: number): Stage =>
  ({
    apiVersion: "v2.edp.epam.com/v1",
    kind: "Stage",
    metadata: { name: `${cdPipeline}-${name}`, namespace: "krci" },
    spec: { cdPipeline, name, order },
  }) as unknown as Stage;

const resolve = (allStages: Stage[], currentStage: Stage) =>
  getStageDeleteDisabledState({
    allStages,
    currentStage,
    deleteProtection: unprotected,
    deletePermission: allowed,
  });

describe("getStageDeleteDisabledState", () => {
  const qa = makeStage("aws-qa3", "qa", 0);
  const cat = makeStage("aws-qa3", "cat", 1);
  const otherDev = makeStage("other-flow", "dev", 0);
  const otherProd = makeStage("other-flow", "prod", 1);

  it("enables delete on the last stage of its own pipeline", () => {
    expect(resolve([qa, cat], cat).status).toBe(false);
  });

  it("disables delete on a non-last stage of its own pipeline", () => {
    expect(resolve([qa, cat], qa)).toEqual({
      status: true,
      reason: "You are able to delete only the last Environment",
    });
  });

  it("disables delete when the pipeline has a single stage", () => {
    expect(resolve([qa], qa)).toEqual({
      status: true,
      reason: "Deployment should have at least one Environment",
    });
  });

  it("ignores stages belonging to other pipelines", () => {
    expect(resolve([qa, cat, otherDev, otherProd], cat).status).toBe(false);
  });

  it("counts only own-pipeline stages when deciding the single-stage case", () => {
    const soloDev = makeStage("solo", "dev", 0);

    expect(resolve([soloDev, qa, cat], soloDev)).toEqual({
      status: true,
      reason: "Deployment should have at least one Environment",
    });
  });

  it("falls back to protection and permission once the stage is deletable", () => {
    expect(
      getStageDeleteDisabledState({
        allStages: [qa, cat],
        currentStage: cat,
        deleteProtection: { isProtected: true, reason: "This resource is protected from deletion." },
        deletePermission: allowed,
      })
    ).toEqual({ status: true, reason: "This resource is protected from deletion." });

    expect(
      getStageDeleteDisabledState({
        allStages: [qa, cat],
        currentStage: cat,
        deleteProtection: unprotected,
        deletePermission: { allowed: false, reason: "Forbidden" },
      })
    ).toEqual({ status: true, reason: "Forbidden" });
  });
});
