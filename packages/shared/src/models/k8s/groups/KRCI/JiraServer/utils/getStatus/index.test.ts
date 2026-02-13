import { describe, expect, it } from "vitest";
import { getJiraServerStatus } from "./index.js";

describe("getJiraServerStatus", () => {
  it("should return status and errorMessage from jiraServer.status", () => {
    const jiraServer = {
      status: {
        status: "Connected",
        detailed_message: "All good",
      },
    } as any;
    expect(getJiraServerStatus(jiraServer)).toEqual({
      status: "connected",
      errorMessage: "All good",
    });
  });

  it("should lowercase status", () => {
    const jiraServer = {
      status: {
        status: "Disconnected",
        detailed_message: undefined,
      },
    } as any;
    expect(getJiraServerStatus(jiraServer)).toEqual({
      status: "disconnected",
      errorMessage: undefined,
    });
  });

  it("should handle missing status", () => {
    expect(getJiraServerStatus({} as any)).toEqual({
      status: undefined,
      errorMessage: undefined,
    });
  });

  it("should handle undefined jiraServer", () => {
    expect(getJiraServerStatus(undefined as any)).toEqual({
      status: undefined,
      errorMessage: undefined,
    });
  });
});
