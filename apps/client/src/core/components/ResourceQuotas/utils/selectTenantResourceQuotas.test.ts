import { describe, expect, test } from "vitest";
import {
  RESOURCE_QUOTA_LABEL_TENANT,
  RESOURCE_QUOTA_LABEL_TENANT_LEGACY,
  type ResourceQuota,
} from "@my-project/shared";
import { selectTenantResourceQuotas } from "./selectTenantResourceQuotas";

const TENANT = "krci";

function createQuota(name: string, labels?: Record<string, string>): ResourceQuota {
  return {
    apiVersion: "v1",
    kind: "ResourceQuota",
    metadata: {
      name,
      namespace: TENANT,
      uid: `${name}-uid`,
      creationTimestamp: "2026-01-01T00:00:00Z",
      labels,
    },
  };
}

function names(items: ResourceQuota[]): string[] {
  return items.map((item) => item.metadata.name);
}

describe("selectTenantResourceQuotas", () => {
  test("selects quotas labeled with the current tenant label", () => {
    const items = [createQuota("capsule-krci-0", { [RESOURCE_QUOTA_LABEL_TENANT]: TENANT })];

    expect(names(selectTenantResourceQuotas(items, TENANT))).toEqual(["capsule-krci-0"]);
  });

  test("selects quotas labeled with the legacy tenant label", () => {
    const items = [createQuota("capsule-krci-0", { [RESOURCE_QUOTA_LABEL_TENANT_LEGACY]: TENANT })];

    expect(names(selectTenantResourceQuotas(items, TENANT))).toEqual(["capsule-krci-0"]);
  });

  test("selects a quota carrying both labels once", () => {
    const items = [
      createQuota("capsule-krci-0", {
        [RESOURCE_QUOTA_LABEL_TENANT]: TENANT,
        [RESOURCE_QUOTA_LABEL_TENANT_LEGACY]: TENANT,
      }),
    ];

    expect(names(selectTenantResourceQuotas(items, TENANT))).toEqual(["capsule-krci-0"]);
  });

  test("selects tenant quotas from a mixed set and skips unlabeled quotas", () => {
    const items = [
      createQuota("capsule-krci-0", { [RESOURCE_QUOTA_LABEL_TENANT]: TENANT }),
      createQuota("capsule-krci-1", { [RESOURCE_QUOTA_LABEL_TENANT_LEGACY]: TENANT }),
      createQuota("manual-quota"),
      createQuota("other-labels", { "app.kubernetes.io/name": "krci" }),
    ];

    expect(names(selectTenantResourceQuotas(items, TENANT))).toEqual(["capsule-krci-0", "capsule-krci-1"]);
  });

  test("ignores quotas of another tenant", () => {
    const items = [
      createQuota("capsule-other-0", { [RESOURCE_QUOTA_LABEL_TENANT]: "other" }),
      createQuota("capsule-other-1", { [RESOURCE_QUOTA_LABEL_TENANT_LEGACY]: "other" }),
    ];

    expect(selectTenantResourceQuotas(items, TENANT)).toEqual([]);
  });

  test("returns an empty array for empty input", () => {
    expect(selectTenantResourceQuotas([], TENANT)).toEqual([]);
  });
});
