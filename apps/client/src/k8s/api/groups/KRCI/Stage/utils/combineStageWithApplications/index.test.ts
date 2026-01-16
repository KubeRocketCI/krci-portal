import { describe, expect, test } from "vitest";
import { combineStageWithApplications } from "./index";
import { applicationLabels } from "@my-project/shared";
import type { Application, Codebase, Stage } from "@my-project/shared";

describe("combineStageWithApplications", () => {
  test("combines stages with applications correctly", () => {
    const applications: Application[] = [
      {
        metadata: {
          name: "app1",
          labels: {
            [applicationLabels.appName]: "app1",
            [applicationLabels.stage]: "stage1",
          },
        },
      } as unknown as Application,
      {
        metadata: {
          name: "app2",
          labels: {
            [applicationLabels.appName]: "app2",
            [applicationLabels.stage]: "stage1",
          },
        },
      } as unknown as Application,
    ];

    const appCodebases: Codebase[] = [
      { metadata: { name: "app1" } } as unknown as Codebase,
      { metadata: { name: "app2" } } as unknown as Codebase,
    ];

    const stages: Stage[] = [{ spec: { name: "stage1" } } as unknown as Stage];

    const result = combineStageWithApplications(applications, appCodebases, stages);

    expect(result).toHaveLength(1);
    expect(result[0].stage.spec.name).toBe("stage1");
    expect(result[0].applications).toHaveLength(2);
    expect(result[0].applications[0].appCodebase.metadata.name).toBe("app1");
    expect(result[0].applications[0].argoApplication).toBeDefined();
    expect(result[0].applications[1].appCodebase.metadata.name).toBe("app2");
    expect(result[0].applications[1].argoApplication).toBeDefined();
  });

  test("handles applications without matching labels", () => {
    const applications: Application[] = [
      {
        metadata: {
          name: "app1",
          labels: {},
        },
      } as unknown as Application,
    ];

    const appCodebases: Codebase[] = [{ metadata: { name: "app1" } } as unknown as Codebase];

    const stages: Stage[] = [{ spec: { name: "stage1" } } as unknown as Stage];

    const result = combineStageWithApplications(applications, appCodebases, stages);

    expect(result[0].applications[0].argoApplication).toBeUndefined();
  });

  test("handles empty arrays", () => {
    const result = combineStageWithApplications([], [], []);
    expect(result).toEqual([]);
  });

  test("handles stages without matching applications", () => {
    const applications: Application[] = [];
    const appCodebases: Codebase[] = [{ metadata: { name: "app1" } } as unknown as Codebase];
    const stages: Stage[] = [{ spec: { name: "stage1" } } as unknown as Stage];

    const result = combineStageWithApplications(applications, appCodebases, stages);

    expect(result).toHaveLength(1);
    expect(result[0].applications[0].argoApplication).toBeUndefined();
  });

  test("handles multiple stages", () => {
    const applications: Application[] = [
      {
        metadata: {
          name: "app1",
          labels: {
            [applicationLabels.appName]: "app1",
            [applicationLabels.stage]: "stage1",
          },
        },
      } as unknown as Application,
    ];

    const appCodebases: Codebase[] = [{ metadata: { name: "app1" } } as unknown as Codebase];

    const stages: Stage[] = [{ spec: { name: "stage1" } } as unknown as Stage, { spec: { name: "stage2" } } as Stage];

    const result = combineStageWithApplications(applications, appCodebases, stages);

    expect(result).toHaveLength(2);
    expect(result[0].applications[0].argoApplication).toBeDefined();
    expect(result[1].applications[0].argoApplication).toBeUndefined();
  });
});
