import { describe, expect, test } from "vitest";
import { parseResourceQuota } from "./parseResourceQuota";
import type { ResourceQuota } from "@my-project/shared";

describe("parseResourceQuota", () => {
  test("parses quotas from annotations when useAnnotations is true", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "test-quota",
          uid: "test-uid-1",
          creationTimestamp: "2024-01-01T00:00:00Z",
          annotations: {
            "quota.example.com/hard-cpu": "4000",
            "quota.example.com/used-cpu": "2000",
            "quota.example.com/hard-memory": "8192",
            "quota.example.com/used-memory": "4096",
          },
        },
      },
    ];

    const result = parseResourceQuota(items, true);

    expect(result.quotas).toEqual({
      cpu: {
        hard: 4000,
        hard_initial: "4000",
        used: 2000,
        used_initial: "2000",
      },
      memory: {
        hard: 8192,
        hard_initial: "8192",
        used: 4096,
        used_initial: "4096",
      },
    });
  });

  test("parses quotas from status when useAnnotations is false", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "test-quota",
          uid: "test-uid-2",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        status: {
          hard: {
            cpu: "4000",
            memory: "8192",
          },
          used: {
            cpu: "2000",
            memory: "4096",
          },
        },
      },
    ];

    const result = parseResourceQuota(items, false);

    expect(result.quotas).toEqual({
      cpu: {
        hard: 4000,
        hard_initial: "4000",
        used: 2000,
        used_initial: "2000",
      },
      memory: {
        hard: 8192,
        hard_initial: "8192",
        used: 4096,
        used_initial: "4096",
      },
    });
  });

  test("calculates highest used quota percentage", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "test-quota",
          uid: "test-uid-3",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        status: {
          hard: {
            cpu: "4000",
            memory: "8192",
            storage: "10240",
          },
          used: {
            cpu: "2000", // 50%
            memory: "6144", // 75%
            storage: "5120", // 50%
          },
        },
      },
    ];

    const result = parseResourceQuota(items, false);

    expect(result.highestUsedQuota).toEqual({
      entity: "memory",
      used: 6144,
      hard: 8192,
      usedPercentage: 75,
    });
  });

  test("returns null for highestUsedQuota when quotas are empty", () => {
    const items: ResourceQuota[] = [];

    const result = parseResourceQuota(items, false);

    expect(result.quotas).toEqual({});
    expect(result.highestUsedQuota).toBeNull();
  });

  test("handles missing annotations gracefully", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "test-quota",
          uid: "test-uid-4",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
      },
    ];

    const result = parseResourceQuota(items, true);

    expect(result.quotas).toEqual({});
    expect(result.highestUsedQuota).toBeNull();
  });

  test("handles missing status gracefully", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "test-quota",
          uid: "test-uid-5",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
      },
    ];

    const result = parseResourceQuota(items, false);

    expect(result.quotas).toEqual({});
    expect(result.highestUsedQuota).toBeNull();
  });

  test("aggregates multiple resource quota items", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "quota-1",
          uid: "test-uid-6",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        status: {
          hard: {
            cpu: "2000",
          },
          used: {
            cpu: "1000",
          },
        },
      },
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "quota-2",
          uid: "test-uid-7",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        status: {
          hard: {
            memory: "4096",
          },
          used: {
            memory: "2048",
          },
        },
      },
    ];

    const result = parseResourceQuota(items, false);

    expect(result.quotas).toEqual({
      cpu: {
        hard: 2000,
        hard_initial: "2000",
        used: 1000,
        used_initial: "1000",
      },
      memory: {
        hard: 4096,
        hard_initial: "4096",
        used: 2048,
        used_initial: "2048",
      },
    });
  });

  test("handles zero used values correctly", () => {
    const items: ResourceQuota[] = [
      {
        apiVersion: "v1",
        kind: "ResourceQuota",
        metadata: {
          name: "test-quota",
          uid: "test-uid-8",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        status: {
          hard: {
            cpu: "4000",
          },
          used: {
            cpu: "0",
          },
        },
      },
    ];

    const result = parseResourceQuota(items, false);

    expect(result.highestUsedQuota).toEqual({
      entity: "cpu",
      used: 0,
      hard: 4000,
      usedPercentage: 0,
    });
  });
});
