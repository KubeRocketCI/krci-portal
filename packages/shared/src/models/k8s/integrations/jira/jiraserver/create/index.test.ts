import { describe, it, expect } from "vitest";
import { createJiraServerDraft } from "./index.js";
import { ZodError } from "zod";
import { k8sJiraServerConfig } from "../../../../groups/KRCI/index.js";

describe("createJiraServerDraft", () => {
  it("should create a valid JiraServer draft", () => {
    const input = {
      url: "https://jira.example.com",
    };

    const result = createJiraServerDraft(input);

    expect(result).toMatchObject({
      apiVersion: `${k8sJiraServerConfig.group}/${k8sJiraServerConfig.version}`,
      kind: k8sJiraServerConfig.kind,
      metadata: {
        name: "epam-jira",
      },
      spec: {
        apiUrl: "https://jira.example.com",
        rootUrl: "https://jira.example.com",
        credentialName: "ci-jira",
      },
    });
  });

  it("should throw ZodError when url is missing", () => {
    const input = {} as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const input = {
      url: 123,
    } as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should handle URLs with ports", () => {
    const input = {
      url: "https://jira.example.com:8080",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com:8080");
    expect(result.spec.rootUrl).toBe("https://jira.example.com:8080");
  });

  it("should handle URLs with paths", () => {
    const input = {
      url: "https://jira.example.com/jira",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com/jira");
    expect(result.spec.rootUrl).toBe("https://jira.example.com/jira");
  });

  it("should handle URLs with query parameters", () => {
    const input = {
      url: "https://jira.example.com?param=value",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com?param=value");
  });

  it("should handle HTTP URLs", () => {
    const input = {
      url: "http://jira.internal.com",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("http://jira.internal.com");
  });

  it("should handle minimal URL", () => {
    const input = {
      url: "http://localhost",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("http://localhost");
    expect(result.spec.rootUrl).toBe("http://localhost");
  });

  it("should always set metadata name to epam-jira", () => {
    const input = {
      url: "https://jira.example.com",
    };

    const result = createJiraServerDraft(input);

    expect(result.metadata.name).toBe("epam-jira");
  });

  it("should always set credentialName to ci-jira", () => {
    const input = {
      url: "https://jira.example.com",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.credentialName).toBe("ci-jira");
  });

  it("should throw ZodError when url is null", () => {
    const input = {
      url: null,
    } as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is undefined", () => {
    const input = {
      url: undefined,
    } as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is a boolean", () => {
    const input = {
      url: true,
    } as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is an object", () => {
    const input = {
      url: { value: "https://jira.example.com" },
    } as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is an array", () => {
    const input = {
      url: ["https://jira.example.com"],
    } as any;

    expect(() => createJiraServerDraft(input)).toThrow(ZodError);
  });

  it("should handle very long URLs", () => {
    const longPath = "/path".repeat(100);
    const input = {
      url: `https://jira.example.com${longPath}`,
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe(`https://jira.example.com${longPath}`);
  });

  it("should handle URLs with special characters", () => {
    const input = {
      url: "https://jira.example.com/api/v1?key=value&other=123",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com/api/v1?key=value&other=123");
  });

  it("should handle localhost URLs", () => {
    const input = {
      url: "http://localhost:8080",
    };

    const result = createJiraServerDraft(input);

    expect(result.spec.apiUrl).toBe("http://localhost:8080");
    expect(result.spec.rootUrl).toBe("http://localhost:8080");
  });
});
