import { describe, expect, test, vi } from "vitest";
import { getJiraServerStatusIcon } from "./index";
import { jiraServerStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import type { JiraServer } from "@my-project/shared";

// Mock the shared function
vi.mock("@my-project/shared", async () => {
  const actual = await vi.importActual("@my-project/shared");
  return {
    ...actual,
    getJiraServerStatus: (jiraServer: JiraServer) => {
      return { status: jiraServer.status?.status };
    },
  };
});

describe("getJiraServerStatusIcon", () => {
  test("returns unknown icon for undefined jiraServer", () => {
    const result = getJiraServerStatusIcon(undefined);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for finished status", () => {
    const jiraServer: JiraServer = {
      apiVersion: "v2.edp.epam.com/v1",
      kind: "JiraServer",
      metadata: {
        name: "test-jira",
        uid: "test-uid-1",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      spec: {
        apiUrl: "https://jira.example.com",
        credentialName: "jira-creds",
        rootUrl: "https://jira.example.com",
      },
      status: {
        status: jiraServerStatus.finished,
        available: true,
        last_time_updated: "2024-01-01T00:00:00Z",
      },
    };

    const result = getJiraServerStatusIcon(jiraServer);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for error status", () => {
    const jiraServer: JiraServer = {
      apiVersion: "v2.edp.epam.com/v1",
      kind: "JiraServer",
      metadata: {
        name: "test-jira",
        uid: "test-uid-2",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      spec: {
        apiUrl: "https://jira.example.com",
        credentialName: "jira-creds",
        rootUrl: "https://jira.example.com",
      },
      status: {
        status: jiraServerStatus.error,
        available: false,
        last_time_updated: "2024-01-01T00:00:00Z",
      },
    };

    const result = getJiraServerStatusIcon(jiraServer);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon for unknown status", () => {
    const jiraServer: JiraServer = {
      apiVersion: "v2.edp.epam.com/v1",
      kind: "JiraServer",
      metadata: {
        name: "test-jira",
        uid: "test-uid-3",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      spec: {
        apiUrl: "https://jira.example.com",
        credentialName: "jira-creds",
        rootUrl: "https://jira.example.com",
      },
      status: {
        status: "unknown-status" as unknown as typeof jiraServerStatus.finished,
        available: true,
        last_time_updated: "2024-01-01T00:00:00Z",
      },
    };

    const result = getJiraServerStatusIcon(jiraServer);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});

