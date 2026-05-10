import { describe, expect, it } from "vitest";
import { k8sCronJobConfig } from "./constants.js";

describe("k8sCronJobConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sCronJobConfig).toMatchObject({
      group: "batch",
      version: "v1",
      apiVersion: "batch/v1",
      kind: "CronJob",
      singularName: "cronjob",
      pluralName: "cronjobs",
    });
  });
});
